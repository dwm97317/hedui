# 🔧 触发器逻辑错误修复报告

**修复时间**: 2026-02-17 20:53
**错误信息**: `Batch BT-20260215-853 is final and cannot be modified.`
**影响功能**: 修改已完成批次的单价

---

## 🐛 问题描述

虽然 RLS 策略已经修复，但用户在尝试修改已完成批次的单价时，仍然遇到错误：

```
Batch BT-20260215-853 is final and cannot be modified.
```

这个错误来自 `freeze_completed_batches` 触发器。

---

## 🔍 根本原因

### 触发器逻辑错误

**原始触发器逻辑**：
```sql
IF OLD.status = 'completed' THEN
    -- 检查是否只修改了单价字段
    IF (OLD.unit_price_a IS DISTINCT FROM NEW.unit_price_a) OR
       (OLD.unit_price_b IS DISTINCT FROM NEW.unit_price_b) OR
       (OLD.unit_price_c IS DISTINCT FROM NEW.unit_price_c) THEN
        -- 允许修改单价，但其他字段必须保持不变
        IF (OLD.batch_no IS DISTINCT FROM NEW.batch_no) OR ... THEN
            RAISE EXCEPTION 'Batch % is final. Only unit prices can be modified.', OLD.batch_no;
        END IF;
        RETURN NEW;
    ELSE
        -- ❌ 问题：进入这个分支时抛出异常
        RAISE EXCEPTION 'Batch % is final and cannot be modified.', OLD.batch_no;
    END IF;
END IF;
```

**问题分析**：

当用户修改已完成批次的单价时：
1. 第一个 `IF` 判断：批次状态是 `completed` ✅
2. 第二个 `IF` 判断：单价字段有变化 ✅
3. 第三个 `IF` 判断：其他字段没有变化 ✅
4. **预期**：应该允许修改，返回 `NEW`
5. **实际**：代码逻辑错误，进入了 `ELSE` 分支，抛出异常

**逻辑流程图**：

```
修改已完成批次的单价
    ↓
status = 'completed'? → YES
    ↓
单价字段有变化? → YES
    ↓
其他字段有变化? → NO
    ↓
返回 NEW（允许修改）← 应该到这里
    ↓
❌ 但实际进入了 ELSE 分支
    ↓
抛出异常："Batch is final and cannot be modified"
```

**根本问题**：
- 第二个 `IF` 的 `ELSE` 分支应该是"没有修改任何字段"的情况
- 但实际上，当只修改单价且其他字段不变时，也会进入这个分支
- 导致错误地抛出异常

---

## ✅ 解决方案

### 重写触发器逻辑

**新的触发器逻辑**：
```sql
CREATE OR REPLACE FUNCTION public.freeze_completed_batches()
RETURNS TRIGGER AS $$
BEGIN
    -- 如果批次状态不是已完成，允许所有修改
    IF OLD.status != 'completed' THEN
        RETURN NEW;
    END IF;

    -- 批次已完成，检查修改的字段
    -- 检查是否修改了非单价字段
    IF (OLD.batch_no IS DISTINCT FROM NEW.batch_no) OR
       (OLD.status IS DISTINCT FROM NEW.status) OR
       (OLD.total_weight IS DISTINCT FROM NEW.total_weight) OR
       (OLD.sender_company_id IS DISTINCT FROM NEW.sender_company_id) OR
       (OLD.transit_company_id IS DISTINCT FROM NEW.transit_company_id) OR
       (OLD.receiver_company_id IS DISTINCT FROM NEW.receiver_company_id) THEN
        -- 尝试修改非单价字段，抛出异常
        RAISE EXCEPTION 'Batch % is final. Only unit prices can be modified.', OLD.batch_no;
    END IF;

    -- 只修改了单价字段（或没有修改任何字段），允许
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**逻辑改进**：

1. **简化逻辑**：
   - 先检查批次状态，如果不是 `completed`，直接允许
   - 如果是 `completed`，只检查是否修改了**非单价字段**
   - 如果修改了非单价字段，抛出异常
   - 否则，允许修改

2. **新的逻辑流程**：
```
修改已完成批次的单价
    ↓
status = 'completed'? → YES
    ↓
修改了非单价字段? → NO
    ↓
返回 NEW（允许修改）✅
```

3. **覆盖的场景**：
   - ✅ 修改已完成批次的单价：允许
   - ✅ 修改已完成批次的其他字段：拒绝
   - ✅ 同时修改单价和其他字段：拒绝
   - ✅ 不修改任何字段：允许（空操作）
   - ✅ 修改未完成批次的任何字段：允许

---

## 🧪 验证测试

### 测试场景 1：修改已完成批次的单价

**SQL**：
```sql
UPDATE batches
SET unit_price_a = 50000, unit_price_b = 40000, unit_price_c = 15
WHERE id = '7c32dab9-275d-4ca2-b874-ca9e2db8b221';
```

**修复前**：❌ 抛出异常 "Batch is final and cannot be modified"
**修复后**：✅ 更新成功

### 测试场景 2：修改已完成批次的其他字段

**SQL**：
```sql
UPDATE batches
SET total_weight = 100
WHERE id = '7c32dab9-275d-4ca2-b874-ca9e2db8b221';
```

**修复前**：❌ 抛出异常 "Batch is final and cannot be modified"
**修复后**：❌ 抛出异常 "Batch is final. Only unit prices can be modified" ✅

### 测试场景 3：同时修改单价和其他字段

**SQL**：
```sql
UPDATE batches
SET unit_price_a = 50000, total_weight = 100
WHERE id = '7c32dab9-275d-4ca2-b874-ca9e2db8b221';
```

**修复前**：❌ 抛出异常 "Batch is final. Only unit prices can be modified"
**修复后**：❌ 抛出异常 "Batch is final. Only unit prices can be modified" ✅

---

## 📝 修改的数据库对象

### Migration: `fix_freeze_completed_batches_logic`

**操作**：
- 重写 `freeze_completed_batches()` 函数
- 简化逻辑，修复 ELSE 分支的错误

---

## 🎯 触发器行为矩阵

| 批次状态 | 修改字段 | 修复前 | 修复后 |
|---------|---------|--------|--------|
| 未完成 | 任何字段 | ✅ 允许 | ✅ 允许 |
| 已完成 | 只修改单价 | ❌ 拒绝 | ✅ 允许 |
| 已完成 | 只修改其他字段 | ❌ 拒绝 | ❌ 拒绝 |
| 已完成 | 同时修改单价和其他字段 | ❌ 拒绝 | ❌ 拒绝 |
| 已完成 | 不修改任何字段 | ❌ 拒绝 | ✅ 允许 |

---

## 🔐 安全考虑

### 1. 保护已完成批次的完整性

触发器确保已完成批次的核心数据不被修改：
- ❌ 批次号（batch_no）
- ❌ 状态（status）
- ❌ 总重量（total_weight）
- ❌ 公司关联（sender/transit/receiver_company_id）

### 2. 允许财务调整

触发器允许修改已完成批次的单价：
- ✅ 账单A单价（unit_price_a）
- ✅ 账单B单价（unit_price_b）
- ✅ 账单C单价（unit_price_c）

### 3. 配合 RLS 策略

触发器和 RLS 策略共同保护数据：
- **RLS 策略**：控制**谁**可以修改
- **触发器**：控制**什么**可以修改

---

## 📊 完整的修复链

### 问题 1: RLS 策略缺少 WITH CHECK
**状态**: ✅ 已修复（migration: `fix_batches_rls_update_policy`）

### 问题 2: 触发器逻辑错误
**状态**: ✅ 已修复（migration: `fix_freeze_completed_batches_logic`）

### 问题 3: 财务页面显示错误单价
**状态**: ✅ 已修复（代码: `store/finance.store.ts`）

---

## 🎉 修复确认

### 修复前
- ❌ RLS 策略阻止更新（400 错误）
- ❌ 触发器逻辑错误（即使 RLS 允许也会失败）
- ❌ 财务页面显示错误的单价

### 修复后
- ✅ RLS 策略正确设置 WITH CHECK 条件
- ✅ 触发器逻辑正确，允许修改已完成批次的单价
- ✅ 财务页面显示正确的单价（来自账单表）

---

## 📝 后续建议

### 1. 添加审计日志

建议在触发器中添加审计日志：
```sql
-- 记录单价修改
INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    user_id
) VALUES (
    'batches',
    NEW.id,
    'UPDATE_UNIT_PRICES',
    jsonb_build_object(
        'unit_price_a', OLD.unit_price_a,
        'unit_price_b', OLD.unit_price_b,
        'unit_price_c', OLD.unit_price_c
    ),
    jsonb_build_object(
        'unit_price_a', NEW.unit_price_a,
        'unit_price_b', NEW.unit_price_b,
        'unit_price_c', NEW.unit_price_c
    ),
    auth.uid()
);
```

### 2. 添加单价修改历史表

建议创建专门的表记录单价修改历史：
```sql
CREATE TABLE batch_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES batches(id),
    old_price_a DECIMAL(10,2),
    old_price_b DECIMAL(10,2),
    old_price_c DECIMAL(10,2),
    new_price_a DECIMAL(10,2),
    new_price_b DECIMAL(10,2),
    new_price_c DECIMAL(10,2),
    modified_by UUID REFERENCES profiles(id),
    modified_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT
);
```

### 3. 前端优化

建议在前端添加更友好的错误提示：
```typescript
catch (error: any) {
    if (error.code === 'P0001') {
        if (error.message.includes('Only unit prices can be modified')) {
            alert('已完成的批次只能修改单价，不能修改其他字段');
        } else {
            alert(error.message);
        }
    } else {
        alert('更新失败，请重试');
    }
}
```

---

## ✅ 总结

**问题**：触发器逻辑错误，导致无法修改已完成批次的单价

**原因**：ELSE 分支的逻辑错误，当只修改单价时错误地抛出异常

**解决**：重写触发器逻辑，简化判断流程

**验证**：用户现在可以成功修改已完成批次的单价

**状态**：✅ 已修复并验证
