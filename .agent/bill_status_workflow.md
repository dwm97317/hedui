# 📋 账单状态工作流说明

**创建时间**: 2026-02-17 21:01
**系统**: 物流通 PDA 系统 - 财务模块

---

## 📊 账单状态枚举

### 定义
```sql
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'cancelled');
```

### 状态说明

| 状态 | 英文 | 说明 | 颜色标识 |
|------|------|------|----------|
| 待处理 | `pending` | 账单已生成，等待支付 | 🟡 橙色 |
| 已支付 | `paid` | 账单已完成支付 | 🟢 绿色 |
| 已取消 | `cancelled` | 账单已取消 | 🔴 红色 |

---

## 🔄 账单生成工作流

### 触发器：`handle_batch_status_change()`

账单的生成是**自动的**，由批次状态变化触发：

```
批次状态变化
    ↓
触发器: handle_batch_status_change()
    ↓
自动生成对应的账单（状态默认为 pending）
```

### 三种账单的生成时机

#### 1. 账单A：发货方 → 平台管理（SENDER_TO_ADMIN）

**触发条件**：批次状态变为 `sealed`（已封箱）

```sql
IF NEW.status = 'sealed' AND (OLD.status IS NULL OR OLD.status != 'sealed') THEN
    INSERT INTO bills (
        batch_id, 
        bill_type, 
        currency, 
        total_weight, 
        unit_price, 
        total_amount,
        payer_company_id,  -- 发货方
        payee_company_id,  -- 平台管理
        status             -- 默认 'pending'
    ) VALUES (
        NEW.id,
        'SENDER_TO_ADMIN',
        'VND',
        NEW.total_weight,
        NEW.unit_price_a,
        NEW.total_weight * NEW.unit_price_a,
        NEW.sender_company_id,
        v_admin_company_id,
        'pending'  -- ✅ 默认状态
    );
END IF;
```

#### 2. 账单B：平台管理 → 运输方（ADMIN_TO_TRANSIT）

**触发条件**：批次状态变为 `in_transit`（运输中）

```sql
IF NEW.status = 'in_transit' AND (OLD.status IS NULL OR OLD.status != 'in_transit') THEN
    INSERT INTO bills (
        batch_id, 
        bill_type, 
        currency, 
        total_weight, 
        unit_price, 
        total_amount,
        payer_company_id,  -- 平台管理
        payee_company_id,  -- 运输方
        status             -- 默认 'pending'
    ) VALUES (
        NEW.id,
        'ADMIN_TO_TRANSIT',
        'VND',
        NEW.total_weight,
        NEW.unit_price_b,
        NEW.total_weight * NEW.unit_price_b,
        v_admin_company_id,
        NEW.transit_company_id,
        'pending'  -- ✅ 默认状态
    );
END IF;
```

#### 3. 账单C：发货方 → 收货方（SENDER_TO_RECEIVER）

**触发条件**：批次状态变为 `completed`（已完成）

```sql
IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO bills (
        batch_id, 
        bill_type, 
        currency, 
        total_weight, 
        unit_price, 
        total_amount,
        payer_company_id,  -- 发货方
        payee_company_id,  -- 收货方
        status             -- 默认 'pending'
    ) VALUES (
        NEW.id,
        'SENDER_TO_RECEIVER',
        'CNY',
        NEW.total_weight,
        NEW.unit_price_c,
        NEW.total_weight * NEW.unit_price_c,
        NEW.sender_company_id,
        NEW.receiver_company_id,
        'pending'  -- ✅ 默认状态
    );
END IF;
```

---

## 🎯 完整的批次-账单生命周期

### 批次状态流转

```
created (已创建)
    ↓
sealed (已封箱) → 🧾 生成账单A (pending)
    ↓
in_transit (运输中) → 🧾 生成账单B (pending)
    ↓
completed (已完成) → 🧾 生成账单C (pending)
```

### 示例流程

假设一个批次从创建到完成：

| 批次状态 | 触发的账单 | 账单类型 | 付款方 | 收款方 | 币种 | 初始状态 |
|---------|-----------|---------|--------|--------|------|---------|
| `created` | - | - | - | - | - | - |
| `sealed` | 账单A | SENDER_TO_ADMIN | 发货方 | 平台 | VND | `pending` |
| `in_transit` | 账单B | ADMIN_TO_TRANSIT | 平台 | 运输方 | VND | `pending` |
| `completed` | 账单C | SENDER_TO_RECEIVER | 发货方 | 收货方 | CNY | `pending` |

---

## 💰 账单状态变更流程 (已实现方案 3)

### 实现说明

我们选择了**方案 3：手动确认流程**，这是最符合真实业务流程的选择。

### 已完成的修改

1. **数据库层 (RLS 策略)**:
   - 更新了 `bills` 表的 RLS 策略，允许**收款方 (Payee)** 和 **管理员 (Admin)** 更新账单状态。
   - 限制了只有管理员可以删除账单。

2. **状态管理层 (Store)**:
   - 在 `finance.store.ts` 中添加了 `updateBillStatus` 动作，支持将账单标记为 `paid` 或其他状态。

3. **用户界面 (UI)**:
   - **收货方门户 (`ReceiverFinance.tsx`)**: 增加了"确认收款"按钮，用于确认收到发货方的货款（账单 C）。
   - **中转方门户 (`TransitFinance.tsx`)**: 增加了"确认结算"按钮，用于确认收到平台的运输费（账单 B）。
   - **账单列表 (`BillList.tsx`)**: 增加了"确认收款"按钮，管理员可在此确认平台收到的物流费（账单 A）。
   - **账单详情 (`BillDetail.tsx`)**: 保持现有的支付/确认逻辑，与后端服务对接。

---

## 🎯 最终的账单-状态模型

| 账单类型 | 收款方 (确认人) | 操作入口 | 状态变化 |
|---------|---------------|---------|---------|
| 账单 A (物流费) | 平台管理 (Admin) | 账单列表/详情 | `pending` → `paid` |
| 账单 B (运输费) | 运输方 (Transit) | 收益中心/详情 | `pending` → `paid` |
| 账单 C (货款) | 收货方 (Receiver) | 收款中心/详情 | `pending` → `paid` |

---

## ✅ 总结与建议

**当前状态**: 🚀 手动确认流程已上线。

**优势**:
- ✅ 权责明确：谁收钱，谁确认。
- ✅ 财务合规：每个状态变更都有系统记录。
- ✅ 灵活性：可以处理线下转账后的系统同步。

**后续建议**:
- 添加支付凭证上传功能。
- 对接自动对账系统。
- 增加支付超时提醒。

---

## 📱 前端UI建议

### 账单列表页面

```
┌─────────────────────────────────────┐
│ 📋 待处理账单                        │
├─────────────────────────────────────┤
│ BT-20260215-853                     │
│ 账单 A (物流费)                      │
│ 金额: 526,850 VND                   │
│ 状态: 🟡 待处理                      │
│ [发送确认] [取消账单]                │
├─────────────────────────────────────┤
│ BT-20260215-897                     │
│ 账单 A (物流费)                      │
│ 金额: 1,285,000 VND                 │
│ 状态: 🟡 待处理                      │
│ [发送确认] [取消账单]                │
└─────────────────────────────────────┘
```

### 账单详情页面

```
┌─────────────────────────────────────┐
│ 账单详情                             │
├─────────────────────────────────────┤
│ 账单编号: BILL-2026-001             │
│ 批次编号: BT-20260215-853           │
│ 账单类型: 账单 A (物流费)            │
│                                     │
│ 付款方: Sender Logistics Co.        │
│ 收款方: Platform Admin              │
│                                     │
│ 重量: 12.85 kg                      │
│ 单价: 41,000 VND/kg                 │
│ 金额: 526,850 VND                   │
│                                     │
│ 状态: 🟡 待处理                      │
│ 创建时间: 2026-02-15 10:30          │
│                                     │
│ [确认支付] [取消账单]                │
└─────────────────────────────────────┘
```

---

## 🔐 权限控制

### RLS 策略

当前的 RLS 策略需要改进：

```sql
-- 当前策略（过于简单）
CREATE POLICY "Users can view their own bills" ON public.bills
    FOR SELECT
    USING (
        auth.uid() IN (payer_company_id, payee_company_id)
    );

-- 建议的策略
-- 1. 查看权限
CREATE POLICY "View bills for related companies"
ON bills
FOR SELECT
TO public
USING (
    payer_company_id = get_my_company_id() 
    OR payee_company_id = get_my_company_id() 
    OR is_admin()
);

-- 2. 更新权限（只有收款方和管理员可以确认支付）
CREATE POLICY "Update bill status"
ON bills
FOR UPDATE
TO public
USING (
    payee_company_id = get_my_company_id() 
    OR is_admin()
)
WITH CHECK (
    payee_company_id = get_my_company_id() 
    OR is_admin()
);
```

---

## 📊 当前数据统计

### 所有账单状态分布

| 账单类型 | 状态 | 数量 | 总金额 |
|---------|------|------|--------|
| SENDER_TO_ADMIN | pending | 9 | 26,685,850 VND |
| ADMIN_TO_TRANSIT | pending | 9 | 21,389,800 VND |
| SENDER_TO_RECEIVER | pending | 9 | 7,976.20 CNY |

**结论**：所有账单都处于 `pending` 状态，等待手动确认支付。

---

## ✅ 总结

### 为什么所有账单都是待处理？

1. **设计如此**：账单生成时，默认状态就是 `pending`
2. **没有自动支付机制**：系统没有自动将账单标记为 `paid` 的触发器
3. **需要手动确认**：财务人员需要手动确认支付

### 账单状态工作流

```
账单生成（pending）
    ↓
【手动操作】财务人员确认支付
    ↓
账单已支付（paid）
```

### 建议

**推荐方案**：保持手动确认流程，但添加以下功能：

1. **批量确认**：允许一次确认多个账单
2. **自动提醒**：账单超过一定时间未支付时发送提醒
3. **支付记录**：记录支付时间、支付方式、操作人
4. **财务报表**：生成应收应付报表

---

**下一步**：您希望我实现哪种方案？
1. 自动支付（批次完成后自动标记为已支付）
2. 分阶段支付（根据批次状态分阶段标记）
3. 手动确认（添加前端确认支付功能）
