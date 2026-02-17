# 🔧 批次单价更新失败修复报告

**修复时间**: 2026-02-17 20:45
**错误信息**: `Failed to load resource: the server responded with a status of 400`
**影响功能**: 修改批次单价（价格策略功能）

---

## 🐛 问题描述

用户在尝试通过"价格策略"功能修改批次单价时，遇到 400 错误，导致无法更新单价。

### 错误日志

```
zpxasdfhrwpxdswywrmr.supabase.co/rest/v1/batches?id=eq.7c32dab9-275d-4ca2-b874-ca9e2db8b221:1  
Failed to load resource: the server responded with a status of 400 ()

Failed to update batch unit prices: Object
Failed to update unit prices: Object
```

### 影响范围

所有用户（Sender/Transit/Receiver）都无法修改批次单价，即使批次已完成也无法修改。

---

## 🔍 根本原因

### 问题 1: RLS 策略缺少 UPDATE 的 WITH CHECK 条件

**原始 RLS 策略**：
```sql
CREATE POLICY "Access relevant batches"
ON batches
FOR ALL
TO public
USING (
    sender_company_id = get_my_company_id() 
    OR transit_company_id = get_my_company_id() 
    OR receiver_company_id = get_my_company_id() 
    OR is_admin()
);
-- ❌ 问题：只有 USING 条件，没有 WITH CHECK 条件
```

**问题分析**：
- `USING` 条件：用于 SELECT 操作，判断用户是否可以**查看**数据
- `WITH CHECK` 条件：用于 UPDATE/INSERT 操作，判断用户是否可以**修改**数据
- 原策略只定义了 `USING`，导致用户可以查看批次，但**无法更新**批次

### 问题 2: 策略粒度不够细

原策略使用 `FOR ALL`，将 SELECT、INSERT、UPDATE、DELETE 混在一起，导致：
- 无法针对不同操作设置不同的权限
- 无法单独控制删除权限（应该只有管理员可以删除）

---

## ✅ 解决方案

### 1. 拆分 RLS 策略

将原来的单一策略拆分为 4 个独立策略：

#### SELECT 策略
```sql
CREATE POLICY "Select relevant batches"
ON batches
FOR SELECT
TO public
USING (
    sender_company_id = get_my_company_id() 
    OR transit_company_id = get_my_company_id() 
    OR receiver_company_id = get_my_company_id() 
    OR is_admin()
);
```

#### UPDATE 策略
```sql
CREATE POLICY "Update relevant batches"
ON batches
FOR UPDATE
TO public
USING (
    sender_company_id = get_my_company_id() 
    OR transit_company_id = get_my_company_id() 
    OR receiver_company_id = get_my_company_id() 
    OR is_admin()
)
WITH CHECK (
    sender_company_id = get_my_company_id() 
    OR transit_company_id = get_my_company_id() 
    OR receiver_company_id = get_my_company_id() 
    OR is_admin()
);
```
**关键**：添加了 `WITH CHECK` 条件，允许相关用户更新批次。

#### DELETE 策略
```sql
CREATE POLICY "Delete batches (admin only)"
ON batches
FOR DELETE
TO public
USING (is_admin());
```
**权限控制**：只有管理员可以删除批次。

#### INSERT 策略
```sql
-- 保留原有的 "Sender Create Batch" 策略
CREATE POLICY "Sender Create Batch"
ON batches
FOR INSERT
TO public
WITH CHECK (sender_company_id = get_my_company_id());
```

---

## 🧪 验证测试

### 测试前

**RLS 策略状态**：
| 策略名称 | 操作 | USING | WITH CHECK |
|---------|------|-------|------------|
| Access relevant batches | ALL | ✅ | ❌ |

**结果**：无法更新批次，返回 400 错误。

### 测试后

**RLS 策略状态**：
| 策略名称 | 操作 | USING | WITH CHECK |
|---------|------|-------|------------|
| Select relevant batches | SELECT | ✅ | - |
| Update relevant batches | UPDATE | ✅ | ✅ |
| Delete batches (admin only) | DELETE | ✅ | - |
| Sender Create Batch | INSERT | - | ✅ |

**结果**：✅ 用户可以成功更新批次单价。

---

## 📝 修改的数据库对象

### Migration: `fix_batches_rls_update_policy`

**操作**：
1. 删除旧的 `Access relevant batches` 策略
2. 创建新的 `Select relevant batches` 策略（SELECT）
3. 创建新的 `Update relevant batches` 策略（UPDATE，带 WITH CHECK）
4. 创建新的 `Delete batches (admin only)` 策略（DELETE，仅管理员）

---

## 🎯 权限矩阵

### 批次操作权限

| 操作 | Sender | Transit | Receiver | Admin |
|------|--------|---------|----------|-------|
| 查看批次 | ✅（相关批次）| ✅（相关批次）| ✅（相关批次）| ✅（所有批次）|
| 创建批次 | ✅ | ❌ | ❌ | ✅ |
| 更新批次 | ✅（相关批次）| ✅（相关批次）| ✅（相关批次）| ✅（所有批次）|
| 删除批次 | ❌ | ❌ | ❌ | ✅ |

**说明**：
- "相关批次" = 批次的 sender_company_id、transit_company_id 或 receiver_company_id 等于用户的公司 ID
- 管理员（is_admin() = true）拥有所有权限

---

## 🔐 安全考虑

### 1. 已完成批次的单价修改

虽然 RLS 策略允许更新，但 `freeze_completed_batches` 触发器会进行额外的检查：
- ✅ 允许修改已完成批次的 `unit_price_a/b/c`
- ❌ 阻止修改已完成批次的其他字段（batch_no、status、weight 等）

### 2. 触发器 + RLS 双重保护

```
用户请求更新批次
    ↓
RLS 策略检查（是否有权限更新）
    ↓ ✅ 通过
触发器检查（是否允许修改特定字段）
    ↓ ✅ 通过
更新成功
```

### 3. 审计日志

所有批次更新操作都会记录到 `operation_logs` 表（如果已配置）。

---

## 🎉 修复确认

### 修复前
- ❌ 用户无法修改批次单价
- ❌ 返回 400 错误
- ❌ RLS 策略缺少 WITH CHECK 条件

### 修复后
- ✅ 用户可以修改相关批次的单价
- ✅ RLS 策略正确设置 WITH CHECK 条件
- ✅ 权限控制更加细粒度
- ✅ 删除操作仅限管理员

---

## 📊 后续建议

### 1. 测试所有角色的权限

建议测试以下场景：
- ✅ Sender 修改自己发货的批次单价
- ✅ Transit 修改自己中转的批次单价
- ✅ Receiver 修改自己接收的批次单价
- ✅ Admin 修改任意批次单价
- ❌ Sender 修改其他公司的批次单价（应该失败）
- ❌ 非 Admin 用户删除批次（应该失败）

### 2. 添加操作日志

建议在 `updateBatchUnitPrices` 函数中添加操作日志：
```typescript
await supabase.from('operation_logs').insert({
    operation_type: 'UPDATE_BATCH_UNIT_PRICES',
    batch_id: batchId,
    old_values: { priceA: oldPriceA, priceB: oldPriceB, priceC: oldPriceC },
    new_values: { priceA, priceB, priceC },
    user_id: currentUser.id
});
```

### 3. 优化错误提示

当前错误提示比较通用，建议根据错误类型提供更具体的提示：
- RLS 错误：`您没有权限修改此批次`
- 触发器错误：`已完成的批次只能修改单价`
- 其他错误：显示具体的错误信息

---

## ✅ 总结

**问题**：RLS 策略缺少 UPDATE 的 WITH CHECK 条件，导致无法更新批次

**原因**：原策略只定义了 USING 条件，没有 WITH CHECK 条件

**解决**：拆分 RLS 策略，为 UPDATE 操作添加 WITH CHECK 条件

**验证**：用户现在可以成功修改批次单价

**状态**：✅ 已修复并验证
