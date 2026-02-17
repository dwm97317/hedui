# 🔧 财务页面金额显示错误修复报告

**修复时间**: 2026-02-17 20:15
**影响页面**: 
- `/finance/sender` (发货方财务中心)
- `/finance/transit` (中转方财务中心)
- `/finance/receiver` (接收方财务中心)

---

## 🐛 问题描述

三个财务页面显示的账单金额使用的是**批次表中的默认单价**，而不是**平台价格策略中配置的单价**。

### 问题示例

以批次 `BT-20260215-853` 为例：

**错误的数据来源**（批次表 `batches`）：
- 账单A单价：41,000 VND/kg ❌
- 账单B单价：36,000 VND/kg ❌
- 账单C单价：9 CNY/kg ❌

**正确的数据来源**（账单表 `bills`）：
- 账单A单价：50,000 VND/kg ✅
- 账单B单价：40,000 VND/kg ✅
- 账单C单价：15 CNY/kg ✅

### 影响范围

所有已完成的批次，如果管理员通过"价格策略"功能修改过单价，财务页面显示的金额都是错误的。

---

## 🔍 根本原因

在 `store/finance.store.ts` 的 `fetchBatches` 函数中：

```typescript
// ❌ 错误的实现
return {
    // ...
    unitPriceA: Number(batch.unit_price_a || 0),  // 从批次表获取
    unitPriceB: Number(batch.unit_price_b || 0),  // 从批次表获取
    unitPriceC: Number(batch.unit_price_c || 0)   // 从批次表获取
};
```

**问题**：
1. `batch.unit_price_a/b/c` 是批次创建时的**默认单价**
2. 当管理员通过"价格策略"修改单价后，只会更新 `bills` 表中的 `unit_price`
3. `batches` 表中的 `unit_price_a/b/c` **不会自动更新**
4. 导致财务页面显示的金额使用的是旧的默认单价

---

## ✅ 解决方案

修改 `fetchBatches` 函数，优先使用账单表中的实际单价：

```typescript
// ✅ 正确的实现
// 获取账单数据
const billA = findBill('SENDER_TO_ADMIN');
const billB = findBill('ADMIN_TO_TRANSIT');
const billC = findBill('SENDER_TO_RECEIVER');

return {
    // ...
    billA,
    billB,
    billC,
    // 使用账单表中的实际单价，而不是批次表中的默认单价
    unitPriceA: billA.unitPrice || Number(batch.unit_price_a || 0),
    unitPriceB: billB.unitPrice || Number(batch.unit_price_b || 0),
    unitPriceC: billC.unitPrice || Number(batch.unit_price_c || 0)
};
```

**逻辑**：
1. 优先使用 `bill.unitPrice`（账单表中的实际单价）
2. 如果账单不存在，则回退到 `batch.unit_price_a/b/c`（批次表中的默认单价）

---

## 🧪 验证测试

### 测试批次：BT-20260215-853

**数据库验证**：
```sql
SELECT 
    b.batch_no,
    b.unit_price_a AS batch_price_a,
    b.unit_price_c AS batch_price_c,
    bill_a.unit_price AS bill_a_price,
    bill_c.unit_price AS bill_c_price
FROM batches b
LEFT JOIN bills bill_a ON b.id = bill_a.batch_id AND bill_a.bill_type = 'SENDER_TO_ADMIN'
LEFT JOIN bills bill_c ON b.id = bill_c.batch_id AND bill_c.bill_type = 'SENDER_TO_RECEIVER'
WHERE b.batch_no = 'BT-20260215-853';
```

**结果**：
| 字段 | 批次表 | 账单表 |
|------|--------|--------|
| 账单A单价 | 41,000 VND/kg | 50,000 VND/kg ✅ |
| 账单C单价 | 9 CNY/kg | 15 CNY/kg ✅ |

### 前端验证

**接收方财务中心** (`/finance/receiver`)：

| 批次号 | 重量 | 显示金额 | 计算单价 | 状态 |
|--------|------|----------|----------|------|
| BT-20260215-853 | 12.85 kg | ¥192.75 | 15 CNY/kg | ✅ 正确 |
| BT-20260215-897 | 25.7 kg | ¥385.50 | 15 CNY/kg | ✅ 正确 |
| BT-20260215-279 | 38.54 kg | ¥578.10 | 15 CNY/kg | ✅ 正确 |
| BT-20260215-166 | 30.54 kg | ¥458.10 | 15 CNY/kg | ✅ 正确 |
| BT-20260215-827 | 49.85 kg | ¥747.75 | 15 CNY/kg | ✅ 正确 |

**计算验证**：
- 192.75 ÷ 12.85 = **15 CNY/kg** ✅
- 385.50 ÷ 25.7 = **15 CNY/kg** ✅
- 578.10 ÷ 38.54 = **15 CNY/kg** ✅

---

## 📝 修改的文件

### `store/finance.store.ts`

**修改位置**：第 143-158 行

**修改内容**：
1. 提前获取账单数据（`billA`, `billB`, `billC`）
2. 修改 `unitPriceA/B/C` 的赋值逻辑，优先使用账单单价

**代码差异**：
```diff
+ // 获取账单数据
+ const billA = findBill('SENDER_TO_ADMIN');
+ const billB = findBill('ADMIN_TO_TRANSIT');
+ const billC = findBill('SENDER_TO_RECEIVER');
+
  return {
      id: batch.id,
      batchCode: batch.batch_no,
      totalWeight: Number(batch.total_weight),
      senderName: batch.sender?.name || 'Unknown Sender',
      transitName: batch.transit?.name || 'Unknown Transit',
      receiverName: batch.receiver?.name || 'Unknown Receiver',
      status: batch.status,
      createdAt: batch.created_at,
-     billA: findBill('SENDER_TO_ADMIN'),
-     billB: findBill('ADMIN_TO_TRANSIT'),
-     billC: findBill('SENDER_TO_RECEIVER'),
-     unitPriceA: Number(batch.unit_price_a || 0),
-     unitPriceB: Number(batch.unit_price_b || 0),
-     unitPriceC: Number(batch.unit_price_c || 0)
+     billA,
+     billB,
+     billC,
+     // 使用账单表中的实际单价，而不是批次表中的默认单价
+     unitPriceA: billA.unitPrice || Number(batch.unit_price_a || 0),
+     unitPriceB: billB.unitPrice || Number(batch.unit_price_b || 0),
+     unitPriceC: billC.unitPrice || Number(batch.unit_price_c || 0)
  };
```

---

## ✅ 修复确认

### 修复前
- 账单C金额：¥115.65（基于 9 CNY/kg）❌
- 显示的是批次表中的默认单价

### 修复后
- 账单C金额：¥192.75（基于 15 CNY/kg）✅
- 显示的是账单表中的实际单价（平台价格策略）

### 影响的页面
1. ✅ `/finance/sender` - 发货方财务中心
2. ✅ `/finance/transit` - 中转方财务中心
3. ✅ `/finance/receiver` - 接收方财务中心

---

## 🎯 后续建议

### 1. 数据一致性
考虑添加数据库触发器，当 `bills` 表的 `unit_price` 更新时，同步更新 `batches` 表的 `unit_price_a/b/c`：

```sql
CREATE OR REPLACE FUNCTION sync_batch_unit_prices()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.bill_type = 'SENDER_TO_ADMIN' THEN
        UPDATE batches SET unit_price_a = NEW.unit_price WHERE id = NEW.batch_id;
    ELSIF NEW.bill_type = 'ADMIN_TO_TRANSIT' THEN
        UPDATE batches SET unit_price_b = NEW.unit_price WHERE id = NEW.batch_id;
    ELSIF NEW.bill_type = 'SENDER_TO_RECEIVER' THEN
        UPDATE batches SET unit_price_c = NEW.unit_price WHERE id = NEW.batch_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_sync_batch_prices
AFTER UPDATE OF unit_price ON bills
FOR EACH ROW
EXECUTE FUNCTION sync_batch_unit_prices();
```

### 2. 单价修改功能
当前的"价格策略"功能可以修改单价，但需要确保：
- ✅ 修改后重新计算账单金额
- ✅ 修改后更新 `bills` 表的 `unit_price`
- ⚠️ 考虑是否需要同步更新 `batches` 表的 `unit_price_a/b/c`

### 3. 审计日志
建议记录所有单价修改操作：
- 修改时间
- 修改人
- 原单价
- 新单价
- 修改原因

---

## 📊 总结

**问题**：财务页面显示的金额使用批次表的默认单价，而不是平台价格策略的单价

**原因**：`fetchBatches` 函数从 `batches` 表获取单价，而不是从 `bills` 表

**解决**：修改逻辑，优先使用 `bills` 表中的实际单价

**验证**：所有财务页面的金额现在都正确显示了平台价格策略的单价

**状态**：✅ 已修复并验证
