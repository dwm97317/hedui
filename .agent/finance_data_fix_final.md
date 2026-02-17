# 财务页面数据问题 - 最终解决报告

**问题**: 财务页面显示所有金额为 0
**根本原因**: RLS 权限配置问题
**状态**: ✅ 已解决

---

## 🔍 问题诊断过程

### 1. 初步发现
- Playwright 测试显示页面加载正常
- 但所有金额显示为 0 ₫ 和 ¥0.00
- 数据库中确实有真实数据

### 2. 深入分析
通过数据库查询发现：
- 数据库中有 3 个批次（BATCH-20260218-01/02/03）
- 每个批次有 3 个账单（A/B/C）
- 账单金额正确（5,025,000 VND, 1,507.50 CNY 等）

### 3. 权限问题定位

#### 测试用户原始配置
```
sender@test.com → Sender Logistics Co. (SENDER_001)
transit@test.com → Global Transit Ltd. (TRANSIT_001)
receiver@test.com → Receiver Depot Inc. (RECEIVER_001)
```

#### 账单数据中的公司
```
Payer: Sender Co. Ltd (SND001)
Payee: Admin Platform (ADM001)
Payee: FastTrans Logistics (TRN001)
Payee: Receiver Store A (RCV001)
```

#### RLS 策略
```sql
-- bills 表的 SELECT 策略
WHERE payer_company_id = get_my_company_id() 
   OR payee_company_id = get_my_company_id()
```

**结论**: 测试用户的公司 ID 与账单中的公司 ID 不匹配，导致 RLS 阻止访问！

---

## ✅ 解决方案

### 数据库迁移
```sql
-- 更新测试用户的公司关联
UPDATE profiles
SET company_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'  -- Sender Co. Ltd
WHERE role = 'sender' AND full_name = 'Test sender User';

UPDATE profiles
SET company_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'  -- FastTrans Logistics
WHERE role = 'transit' AND full_name = 'Test transit User';

UPDATE profiles
SET company_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'  -- Receiver Store A
WHERE role = 'receiver' AND full_name = 'Test receiver User';
```

### 迁移名称
`fix_test_user_companies.sql`

---

## 📊 修复后的测试结果

### Playwright 测试
```
✅ Sender Finance Page test passed!
   - 找到 3 个批次代码
   - 找到 4 个 VND 金额
   - 找到 4 个 CNY 金额
```

### 实际显示数据
**发货方财务页面** (`/finance/sender`):
- **应付总额（物流费）**: 5,025,000 ₫
- **应付总额（货款）**: ¥1,507.50

**批次详情**:
- **BATCH-20260218-01** (100.5 kg, 运输中)
  - 账单 A: 5,025,000 ₫ (待处理)
  - 账单 C: ¥1,507.50 (待处理)

- **BATCH-20260218-02** (250 kg, received)
  - 账单 A: 12,500,000 ₫ (已支付)
  - 账单 C: ¥3,750.00 (已支付)

- **BATCH-20260218-03** (50 kg, completed)
  - 账单 A: 2,500,000 ₫ (已支付)
  - 账单 C: ¥750.00 (已支付)

---

## 🎯 用户操作指南

### 立即生效步骤
1. **退出登录** - 点击右上角退出按钮
2. **重新登录** - 使用以下凭据：
   ```
   发货方: sender@test.com / password
   中转方: transit@test.com / password
   接收方: receiver@test.com / password
   ```
3. **访问财务页面**:
   - 发货方: `/finance/sender`
   - 中转方: `/finance/transit`
   - 接收方: `/finance/receiver`

### 预期结果
- ✅ 看到真实的账单金额（不再是 0）
- ✅ 看到批次列表和详细信息
- ✅ 可以点击"价格策略"按钮查看单价配置

---

## 📸 对比截图

### 修复前
- 应付总额（物流费）: **0 ₫**
- 应付总额（货款）: **¥0.00**
- 账单A: **0 ₫**
- 账单C: **¥0.00**

### 修复后
- 应付总额（物流费）: **5,025,000 ₫**
- 应付总额（货款）: **¥1,507.50**
- 账单A: **5,025,000 ₫**
- 账单C: **¥1,507.50**

---

## 🔧 技术细节

### RLS 策略工作原理
1. 用户登录后，Supabase Auth 设置 `auth.uid()`
2. `get_my_company_id()` 函数查询 `profiles` 表获取用户的 `company_id`
3. RLS 策略检查 `bills` 表的 `payer_company_id` 或 `payee_company_id` 是否匹配
4. 只返回匹配的行

### 为什么之前显示 0
- Supabase 查询成功执行
- 但 RLS 过滤掉了所有行（因为公司 ID 不匹配）
- 前端收到空数组 `bills: []`
- `findBill()` 返回默认值 `amount: 0`

### 为什么现在正常
- 测试用户的 `company_id` 现在匹配账单中的公司
- RLS 允许访问相关账单
- 前端收到完整数据
- 显示真实金额

---

## ✅ 验证清单

- [x] 数据库中有真实批次和账单数据
- [x] 测试用户关联到正确的公司
- [x] RLS 策略允许访问
- [x] Playwright 测试通过
- [x] 截图显示真实数据
- [x] 三个角色（sender/transit/receiver）都已修复

---

## 📝 后续建议

### 1. 生产环境注意事项
- 确保真实用户的 `company_id` 正确设置
- 在用户注册时自动关联到正确的公司
- 添加公司管理界面让管理员分配用户

### 2. 测试数据一致性
- 使用统一的公司代码（建议使用 SND001, TRN001, RCV001）
- 或者创建数据时使用测试用户的公司 ID
- 添加数据验证确保公司关联正确

### 3. 错误提示优化
- 当用户看不到数据时，显示友好提示
- 例如："您还没有相关的财务数据"
- 而不是显示 0

---

## 🎉 总结

**问题**: 财务页面显示 0
**原因**: RLS 权限配置导致数据被过滤
**解决**: 更新测试用户的公司关联
**结果**: ✅ 数据正确显示

**用户只需重新登录即可看到真实数据！**
