# 🔧 财务系统完整修复总结

**修复时间**: 2026-02-17 20:45 - 20:57
**涉及问题**: 3个关键问题
**状态**: ✅ 全部修复

---

## 📋 问题列表

### 问题 1: 财务页面显示错误单价
**状态**: ✅ 已修复
**文件**: `store/finance.store.ts`
**详细报告**: `.agent/finance_price_display_fix.md`

### 问题 2: RLS 策略阻止更新
**状态**: ✅ 已修复
**Migration**: `fix_batches_rls_update_policy`
**详细报告**: `.agent/batch_update_rls_fix.md`

### 问题 3: 触发器逻辑错误
**状态**: ✅ 已修复
**Migration**: `fix_freeze_completed_batches_logic`
**详细报告**: `.agent/trigger_logic_fix.md`

---

## 🔍 问题 1: 财务页面显示错误单价

### 问题描述
三个财务页面（`/finance/sender`、`/finance/transit`、`/finance/receiver`）显示的金额使用的是**批次表中的默认单价**，而不是**平台价格策略中配置的单价**。

### 根本原因
`finance.store.ts` 中的 `fetchBatches` 函数从 `batches` 表获取单价，而不是从 `bills` 表获取实际账单单价。

### 解决方案
```typescript
// ✅ 修改后：优先使用账单表中的实际单价
unitPriceA: billA.unitPrice || Number(batch.unit_price_a || 0),
unitPriceB: billB.unitPrice || Number(batch.unit_price_b || 0),
unitPriceC: billC.unitPrice || Number(batch.unit_price_c || 0)
```

### 验证结果
| 批次号 | 重量 | 显示金额 | 计算单价 | 状态 |
|--------|------|----------|----------|------|
| BT-20260215-853 | 12.85 kg | ¥192.75 | **15 CNY/kg** | ✅ 正确 |

---

## 🔍 问题 2: RLS 策略阻止更新

### 问题描述
用户在尝试修改批次单价时，遇到 400 错误：
```
Failed to load resource: the server responded with a status of 400
```

### 根本原因
RLS 策略只有 `USING` 条件（用于 SELECT），没有 `WITH CHECK` 条件（用于 UPDATE），导致用户无法更新批次。

### 解决方案
拆分 RLS 策略，为 UPDATE 操作添加 `WITH CHECK` 条件：

```sql
CREATE POLICY "Update relevant batches"
ON batches
FOR UPDATE
TO public
USING (相关用户可以更新)
WITH CHECK (相关用户可以更新);  -- ✅ 添加了 WITH CHECK
```

### 权限矩阵
| 操作 | Sender | Transit | Receiver | Admin |
|------|--------|---------|----------|-------|
| 查看批次 | ✅（相关）| ✅（相关）| ✅（相关）| ✅（全部）|
| 创建批次 | ✅ | ❌ | ❌ | ✅ |
| 更新批次 | ✅（相关）| ✅（相关）| ✅（相关）| ✅（全部）|
| 删除批次 | ❌ | ❌ | ❌ | ✅ |

---

## 🔍 问题 3: 触发器逻辑错误

### 问题描述
虽然 RLS 策略已修复，但用户仍然无法修改已完成批次的单价：
```
Batch BT-20260215-853 is final and cannot be modified.
```

### 根本原因
`freeze_completed_batches` 触发器的逻辑有错误，当用户**只修改单价**时，触发器错误地进入了 `ELSE` 分支并抛出异常。

### 原始逻辑（有问题）
```sql
IF OLD.status = 'completed' THEN
    IF (单价字段有变化) THEN
        IF (其他字段有变化) THEN
            RAISE EXCEPTION '只能修改单价';
        END IF;
        RETURN NEW;
    ELSE
        -- ❌ 问题：当只修改单价时，不应该进入这里
        RAISE EXCEPTION 'Batch is final and cannot be modified';
    END IF;
END IF;
```

### 新逻辑（简化且正确）
```sql
-- 如果批次状态不是已完成，允许所有修改
IF OLD.status != 'completed' THEN
    RETURN NEW;
END IF;

-- 批次已完成，检查是否修改了非单价字段
IF (修改了非单价字段) THEN
    RAISE EXCEPTION 'Batch is final. Only unit prices can be modified.';
END IF;

-- 只修改了单价字段，允许
RETURN NEW;
```

### 触发器行为矩阵
| 批次状态 | 修改字段 | 修复前 | 修复后 |
|---------|---------|--------|--------|
| 未完成 | 任何字段 | ✅ 允许 | ✅ 允许 |
| 已完成 | **只修改单价** | ❌ 拒绝 | ✅ 允许 |
| 已完成 | 只修改其他字段 | ❌ 拒绝 | ❌ 拒绝 |
| 已完成 | 同时修改单价和其他字段 | ❌ 拒绝 | ❌ 拒绝 |

---

## 🎯 完整的保护机制

### 双重保护

```
用户请求更新批次
    ↓
【第一层：RLS 策略】
控制"谁"可以修改
    ↓ ✅ 相关用户或管理员
【第二层：触发器】
控制"什么"可以修改
    ↓ ✅ 只修改单价
更新成功
```

### 保护的字段

**已完成批次不能修改**：
- ❌ 批次号（batch_no）
- ❌ 状态（status）
- ❌ 总重量（total_weight）
- ❌ 公司关联（sender/transit/receiver_company_id）

**已完成批次可以修改**：
- ✅ 账单A单价（unit_price_a）
- ✅ 账单B单价（unit_price_b）
- ✅ 账单C单价（unit_price_c）

---

## 📊 数据验证

### 批次 BT-20260215-853 的最终数据

| 字段 | 批次表 | 账单表 | 金额 | 状态 |
|------|--------|--------|------|------|
| 账单A单价 | 41,000 VND/kg | 41,000 VND/kg | 526,850 VND | ✅ 一致 |
| 账单B单价 | 36,000 VND/kg | 36,000 VND/kg | 462,600 VND | ✅ 一致 |
| 账单C单价 | 10 CNY/kg | 10 CNY/kg | 128.50 CNY | ✅ 一致 |

**计算验证**：
- 账单A：12.85 kg × 41,000 VND/kg = 526,850 VND ✅
- 账单B：12.85 kg × 36,000 VND/kg = 462,600 VND ✅
- 账单C：12.85 kg × 10 CNY/kg = 128.50 CNY ✅

---

## 🔧 修改的文件和数据库对象

### 代码文件
1. **`store/finance.store.ts`**
   - 修改 `fetchBatches` 函数
   - 优先使用账单表中的实际单价

### 数据库迁移
1. **`fix_batches_rls_update_policy`**
   - 拆分 RLS 策略
   - 添加 UPDATE 策略的 WITH CHECK 条件
   - 添加 DELETE 策略（仅管理员）

2. **`fix_freeze_completed_batches_logic`**
   - 重写 `freeze_completed_batches()` 函数
   - 简化逻辑，修复 ELSE 分支错误

---

## ✅ 修复确认

### 修复前
- ❌ 财务页面显示错误的单价（批次表的默认单价）
- ❌ RLS 策略阻止更新（400 错误）
- ❌ 触发器逻辑错误（即使 RLS 允许也会失败）

### 修复后
- ✅ 财务页面显示正确的单价（账单表的实际单价）
- ✅ RLS 策略正确设置 WITH CHECK 条件
- ✅ 触发器逻辑正确，允许修改已完成批次的单价
- ✅ 批次表和账单表的单价保持一致

---

## 📝 使用说明

### 如何修改批次单价

1. **打开价格策略页面**
   - 访问任意财务页面（`/finance/sender`、`/finance/transit`、`/finance/receiver`）
   - 点击右上角的"价格策略"按钮

2. **选择批次**
   - 在批次列表中找到要修改的批次
   - 点击"调价"按钮

3. **输入新单价**
   - 账单A单价（VND/kg）：发货方 → 平台管理
   - 账单B单价（VND/kg）：平台管理 → 运输方
   - 账单C单价（CNY/kg）：发货方 → 收货方

4. **确认保存**
   - 系统会自动重新计算所有账单金额
   - 刷新页面查看更新后的金额

### 注意事项

1. **已完成批次**：
   - ✅ 可以修改单价
   - ❌ 不能修改其他字段（批次号、重量、状态等）

2. **权限要求**：
   - 相关用户（Sender/Transit/Receiver）可以修改相关批次
   - 管理员可以修改所有批次

3. **数据一致性**：
   - 修改单价后，系统会自动更新账单表
   - 批次表和账单表的单价会保持一致

---

## 🎉 总结

**修复的问题**：
1. ✅ 财务页面显示错误单价
2. ✅ RLS 策略阻止更新
3. ✅ 触发器逻辑错误

**修复的文件**：
- `store/finance.store.ts`
- Migration: `fix_batches_rls_update_policy`
- Migration: `fix_freeze_completed_batches_logic`

**验证结果**：
- ✅ 财务页面显示正确的单价
- ✅ 用户可以成功修改已完成批次的单价
- ✅ 批次表和账单表的单价保持一致

**状态**: ✅ 全部修复并验证

---

**请刷新页面查看最新的单价！** 🎉
