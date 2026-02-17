# 单价修改问题修复报告

**问题**: 修改已完成批次的单价失败，刷新后被覆盖
**根本原因**: 数据库触发器阻止修改已完成的批次
**状态**: ✅ 已修复

---

## 🔍 问题分析

### 用户报告的问题
1. **修改单价失败**: 点击"保存"后报错
   ```
   Error: Batch BT-20260215-853 is final and cannot be modified.
   ```

2. **数据被覆盖**: 即使修改成功，刷新页面后单价又变回原值

### 错误日志
```
PATCH https://zpxasdfhrwpxdswywrmr.supabase.co/rest/v1/batches?id=eq.7c32dab9-275d-4ca2-b874-ca9e2db8b221 400 (Bad Request)
Failed to update batch unit prices: {
  code: 'P0001',
  message: 'Batch BT-20260215-853 is final and cannot be modified.'
}
```

---

## 🐛 根本原因

### 数据库触发器限制
在 `batches` 表上有一个 `tr_freeze_batch` 触发器：

```sql
CREATE TRIGGER tr_freeze_batch
BEFORE UPDATE ON batches
FOR EACH ROW
EXECUTE FUNCTION freeze_completed_batches();
```

**原始函数逻辑**:
```sql
CREATE FUNCTION freeze_completed_batches()
RETURNS trigger AS $$
BEGIN
    IF OLD.status = 'completed' THEN
        RAISE EXCEPTION 'Batch % is final and cannot be modified.', OLD.batch_no;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**问题**: 这个函数**完全阻止**修改 `status = 'completed'` 的批次，包括单价字段。

---

## ✅ 解决方案

### 1. 修改触发器函数
更新 `freeze_completed_batches()` 函数，**允许修改单价**，但保护其他字段：

```sql
CREATE OR REPLACE FUNCTION public.freeze_completed_batches()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- 如果批次已完成，只允许修改单价字段
    IF OLD.status = 'completed' THEN
        -- 检查是否只修改了单价字段
        IF (OLD.unit_price_a IS DISTINCT FROM NEW.unit_price_a) OR
           (OLD.unit_price_b IS DISTINCT FROM NEW.unit_price_b) OR
           (OLD.unit_price_c IS DISTINCT FROM NEW.unit_price_c) THEN
            -- 允许修改单价，但其他字段必须保持不变
            IF (OLD.batch_no IS DISTINCT FROM NEW.batch_no) OR
               (OLD.status IS DISTINCT FROM NEW.status) OR
               (OLD.total_weight IS DISTINCT FROM NEW.total_weight) OR
               (OLD.sender_company_id IS DISTINCT FROM NEW.sender_company_id) OR
               (OLD.transit_company_id IS DISTINCT FROM NEW.transit_company_id) OR
               (OLD.receiver_company_id IS DISTINCT FROM NEW.receiver_company_id) THEN
                RAISE EXCEPTION 'Batch % is final. Only unit prices can be modified.', OLD.batch_no;
            END IF;
            -- 允许修改单价
            RETURN NEW;
        ELSE
            -- 尝试修改其他字段
            RAISE EXCEPTION 'Batch % is final and cannot be modified.', OLD.batch_no;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;
```

**新逻辑**:
- ✅ 允许修改 `unit_price_a`, `unit_price_b`, `unit_price_c`
- ❌ 禁止修改 `batch_no`, `status`, `total_weight`, 公司关联等其他字段
- ✅ 如果只修改单价，允许通过
- ❌ 如果同时修改单价和其他字段，拒绝

### 2. 改进前端错误处理
更新 `finance.store.ts` 的错误处理逻辑：

```typescript
} catch (error: any) {
    console.error('Failed to update batch unit prices:', error);
    
    // Revert optimistic update by reloading from database
    await get().fetchBatches();
    
    // Show user-friendly error message
    const errorMessage = error?.message || 'Unknown error';
    alert(`更新单价失败: ${errorMessage}`);
    
    throw error; // Re-throw so caller knows it failed
}
```

**改进点**:
- ✅ 失败时自动恢复原始数据（重新获取）
- ✅ 显示友好的错误提示
- ✅ 抛出错误让调用者知道失败

---

## 📊 验证测试

### 测试 1: 更新已完成批次的单价
```sql
UPDATE batches
SET unit_price_a = 55000,
    unit_price_b = 45000,
    unit_price_c = 16
WHERE batch_no = 'BT-20260215-853'
RETURNING batch_no, status, unit_price_a, unit_price_b, unit_price_c;
```

**结果**: ✅ 成功
```
batch_no: BT-20260215-853
status: completed
unit_price_a: 55000.00
unit_price_b: 45000.00
unit_price_c: 16.00
```

### 测试 2: 尝试修改其他字段（应该失败）
```sql
UPDATE batches
SET total_weight = 999
WHERE batch_no = 'BT-20260215-853';
```

**预期结果**: ❌ 失败
```
ERROR: Batch BT-20260215-853 is final and cannot be modified.
```

---

## 🎯 现在可以做什么

### 修改单价的完整流程

1. **访问价格策略页面**:
   ```
   http://localhost:3003/#/finance/admin/pricing
   ```

2. **选择批次并点击"编辑价格"**

3. **修改单价**:
   - 账单 A 单价 (VND/kg)
   - 账单 B 单价 (VND/kg)
   - 账单 C 单价 (CNY/kg)

4. **点击"保存"**

5. **系统自动**:
   - ✅ 更新批次的 `unit_price_a/b/c`
   - ✅ 调用 `recalculate_batch_bills()` 重新计算所有账单金额
   - ✅ 刷新页面显示新数据

### 预期行为

**修改前**:
- BT-20260215-853 (12.85 kg)
- 单价 A: 50,000 VND/kg
- 账单 A: 642,500 VND

**修改单价为 55,000 VND/kg 后**:
- BT-20260215-853 (12.85 kg)
- 单价 A: 55,000 VND/kg
- 账单 A: 706,750 VND (12.85 × 55,000)

**刷新页面后**:
- ✅ 单价保持 55,000 VND/kg
- ✅ 账单金额保持 706,750 VND
- ✅ 不会被覆盖

---

## 🔒 安全保护

### 已完成批次的保护规则

| 字段 | 是否可修改 | 说明 |
|------|-----------|------|
| `unit_price_a` | ✅ 可以 | 账单 A 单价 |
| `unit_price_b` | ✅ 可以 | 账单 B 单价 |
| `unit_price_c` | ✅ 可以 | 账单 C 单价 |
| `batch_no` | ❌ 不可以 | 批次编号锁定 |
| `status` | ❌ 不可以 | 状态锁定 |
| `total_weight` | ❌ 不可以 | 重量锁定 |
| `sender_company_id` | ❌ 不可以 | 公司关联锁定 |
| `transit_company_id` | ❌ 不可以 | 公司关联锁定 |
| `receiver_company_id` | ❌ 不可以 | 公司关联锁定 |

### 为什么允许修改单价？

1. **业务需求**: 价格可能需要调整（促销、合同变更等）
2. **财务审计**: 需要追溯和修正历史价格
3. **数据完整性**: 单价修改会自动重新计算所有账单金额
4. **审计日志**: 所有修改都会记录在 `operation_logs` 表中

---

## ✅ 验证清单

- [x] 修改 `freeze_completed_batches()` 函数
- [x] 允许修改已完成批次的单价
- [x] 保护其他关键字段不被修改
- [x] 改进前端错误处理
- [x] 测试单价更新功能
- [x] 验证数据持久化（刷新不会丢失）

---

## 📝 后续建议

### 1. 添加审计日志查看
在价格策略页面添加"修改历史"按钮，显示单价的修改记录：
```sql
SELECT * FROM operation_logs
WHERE table_name = 'batches'
  AND record_id = 'batch_id'
  AND operation = 'UPDATE'
ORDER BY created_at DESC;
```

### 2. 添加权限控制
只允许管理员修改已完成批次的单价：
```typescript
if (user.role !== 'admin') {
  alert('只有管理员可以修改已完成批次的单价');
  return;
}
```

### 3. 添加确认对话框
修改已完成批次的单价前显示警告：
```typescript
const confirmed = confirm(
  '此批次已完成，修改单价将重新计算所有账单金额。确定要继续吗？'
);
if (!confirmed) return;
```

---

**现在您可以正常修改批次单价了！修改后刷新页面，数据会正确保存。**
