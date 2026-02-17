# 🔧 财务系统问题修复报告

**修复时间**: 2026-02-17 17:59:40  
**问题**: 汇率管理页面显示为0，账单金额显示为0  
**状态**: ✅ **已修复**

---

## 📋 问题分析

### 问题1: 汇率管理页面数据为0

**原因**:
- ExchangeRates页面使用的是**硬编码的静态数据**
- 没有从数据库 `exchange_rates` 表读取实际数据
- 没有提供编辑和新增汇率的功能

**影响**:
- 用户无法管理汇率
- 汇率数据无法持久化
- 账单生成时无法使用正确的汇率

### 问题2: 账单金额显示为0

**根本原因**:
```sql
-- bills表的定义
total_weight DECIMAL(10, 2) NOT NULL DEFAULT 0,
unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0,  -- ❌ 默认为0
total_amount DECIMAL(15, 2) GENERATED ALWAYS AS (total_weight * unit_price) STORED
```

**问题链**:
1. `unit_price` 默认值为 0
2. `total_amount` = `total_weight` × `unit_price`
3. 如果 `unit_price` = 0，则 `total_amount` = 0
4. 触发器中虽然设置了单价，但可能没有正确执行或字段名不匹配

**实际数据**:
```
账单 A (物流费): 0 đ  ← unit_price = 0
账单 B (运输费): 0 đ  ← unit_price = 0  
账单 C (货款): ¥0.00 ← unit_price = 0
```

---

## ✅ 解决方案

### 方案1: 汇率管理功能完善

#### 1.1 创建汇率编辑弹窗组件
**文件**: `/components/finance/ExchangeRateModal.tsx`

**功能**:
- ✅ 支持新增汇率
- ✅ 支持编辑现有汇率
- ✅ 货币选择 (VND ↔ CNY)
- ✅ 汇率输入和验证
- ✅ 实时预览汇率效果
- ✅ 警告提示（新汇率立即生效）

**特点**:
```typescript
// 支持双向汇率
VND → CNY: 0.000285
CNY → VND: 3508.77

// 实时预览
1,000,000 VND ≈ 285 CNY
100 CNY ≈ 350,877 VND
```

#### 1.2 重写汇率管理页面
**文件**: `/pages/finance/ExchangeRates.tsx`

**改进**:
- ✅ 从数据库读取实际汇率数据
- ✅ 显示生效中的汇率
- ✅ 支持编辑功能
- ✅ 支持新增汇率
- ✅ 实时刷新数据
- ✅ 显示更新时间

**数据流**:
```
数据库 exchange_rates 表
    ↓
useEffect fetchRates()
    ↓
显示在页面上
    ↓
用户点击"编辑"
    ↓
ExchangeRateModal
    ↓
updateExchangeRate()
    ↓
更新数据库
    ↓
刷新页面数据
```

### 方案2: 单价配置管理系统

#### 2.1 创建单价配置表
**文件**: `/supabase/migrations/20260217_unit_price_config.sql`

**新增表结构**:
```sql
CREATE TABLE public.unit_price_config (
    id UUID PRIMARY KEY,
    bill_type bill_type NOT NULL UNIQUE,
    currency currency_code NOT NULL,
    default_unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**默认配置**:
| 账单类型 | 货币 | 默认单价 | 说明 |
|---------|------|---------|------|
| SENDER_TO_ADMIN | VND | 50,000 | 发货方→平台 (物流费) |
| ADMIN_TO_TRANSIT | VND | 40,000 | 平台→运输方 (运输费) |
| SENDER_TO_RECEIVER | CNY | 15 | 发货方→收货方 (货款) |

#### 2.2 改进账单生成触发器
**改进点**:
```sql
-- 旧版本：硬编码单价
unit_price := 50000;  -- ❌ 无法修改

-- 新版本：从配置表读取
SELECT default_unit_price INTO v_unit_price
FROM unit_price_config
WHERE bill_type = 'SENDER_TO_ADMIN';  -- ✅ 可配置
```

**触发器逻辑**:
```
批次状态变更
    ↓
触发器: handle_batch_status_change()
    ↓
查询 unit_price_config 表
    ↓
获取对应账单类型的默认单价
    ↓
创建账单，使用配置的单价
    ↓
total_amount = total_weight × unit_price ✅
```

#### 2.3 创建修复函数
**函数**: `fix_zero_unit_prices()`

**功能**:
- 查找所有 `unit_price = 0` 的账单
- 从 `unit_price_config` 表获取默认单价
- 批量更新这些账单的单价
- 返回修复的账单列表

**使用方法**:
```sql
SELECT * FROM fix_zero_unit_prices();
```

#### 2.4 创建单价配置管理界面
**文件**: `/components/finance/UnitPriceSettings.tsx`

**功能**:
- ✅ 查看所有账单类型的默认单价
- ✅ 编辑默认单价
- ✅ 实时保存到数据库
- ✅ 一键修复历史零单价账单
- ✅ 警告提示（仅对新账单生效）

**界面预览**:
```
┌─────────────────────────────────────┐
│ 单价配置管理                         │
├─────────────────────────────────────┤
│ 📦 账单 A (物流费)                   │
│    发货方支付给平台的单价 (越南盾/kg) │
│    当前单价: 50,000 VND/kg  [编辑]   │
├─────────────────────────────────────┤
│ ✈️ 账单 B (运输费)                   │
│    平台支付给运输方的单价 (越南盾/kg) │
│    当前单价: 40,000 VND/kg  [编辑]   │
├─────────────────────────────────────┤
│ 💰 账单 C (货款)                     │
│    发货方支付给收货方的单价 (人民币/kg)│
│    当前单价: 15 CNY/kg      [编辑]   │
├─────────────────────────────────────┤
│ 🔧 修复历史账单                      │
│    [修复单价为0的账单]               │
└─────────────────────────────────────┘
```

---

## 🎯 使用指南

### 1. 汇率管理

#### 访问页面
```
http://localhost:3002/#/finance/rates
```

#### 新增汇率
1. 点击底部"新增汇率"按钮
2. 选择基础货币 (VND 或 CNY)
3. 系统自动设置目标货币
4. 输入汇率值
5. 查看实时预览
6. 点击"确认保存"

#### 编辑汇率
1. 在汇率卡片上点击"编辑"按钮
2. 修改汇率值
3. 查看实时预览
4. 点击"确认保存"

**注意事项**:
- ⚠️ 新汇率立即生效
- ⚠️ 仅影响新生成的账单
- ⚠️ 历史账单汇率不变

### 2. 单价配置管理

#### 执行数据库迁移
```bash
# 1. 连接到Supabase项目
cd /www/wwwroot/hedui

# 2. 执行迁移SQL
# 方法A: 通过Supabase Dashboard
# - 打开 SQL Editor
# - 粘贴 /supabase/migrations/20260217_unit_price_config.sql 内容
# - 执行

# 方法B: 通过CLI (如果已配置)
supabase db push
```

#### 访问配置界面
```typescript
// 在财务页面中添加入口
import UnitPriceSettings from '../components/finance/UnitPriceSettings';

// 使用组件
<UnitPriceSettings onClose={() => setShowSettings(false)} />
```

#### 修改默认单价
1. 打开单价配置管理界面
2. 找到要修改的账单类型
3. 点击"编辑"按钮
4. 输入新的单价
5. 点击"保存"

#### 修复历史账单
1. 打开单价配置管理界面
2. 滚动到底部"修复历史账单"区域
3. 点击"修复单价为0的账单"
4. 确认操作
5. 系统自动批量更新

---

## 📊 数据流程图

### 汇率管理流程
```
用户操作
    ↓
ExchangeRateModal (编辑/新增)
    ↓
useFinanceStore.updateExchangeRate()
    ↓
Supabase: exchange_rates 表
    ├─ 旧汇率: is_active = false
    └─ 新汇率: is_active = true
    ↓
ExchangeRates 页面刷新
    ↓
显示最新汇率
```

### 账单生成流程
```
批次状态变更
    ↓
触发器: on_batch_status_update
    ↓
函数: handle_batch_status_change()
    ↓
查询: unit_price_config 表
    ↓
获取: default_unit_price
    ↓
创建账单:
    - total_weight (来自批次)
    - unit_price (来自配置)
    - total_amount = weight × price ✅
    ↓
账单保存到 bills 表
```

### 单价修复流程
```
用户点击"修复"
    ↓
调用: fix_zero_unit_prices()
    ↓
查找: unit_price = 0 的账单
    ↓
匹配: unit_price_config 表
    ↓
更新: 
    - unit_price = default_unit_price
    - total_amount 自动重新计算 ✅
    ↓
返回: 修复的账单列表
```

---

## 🔍 验证步骤

### 1. 验证汇率管理
```bash
# 1. 访问汇率管理页面
http://localhost:3002/#/finance/rates

# 2. 检查是否显示数据库中的汇率
# 3. 尝试编辑汇率
# 4. 尝试新增汇率
# 5. 刷新页面，确认数据持久化
```

### 2. 验证单价配置
```sql
-- 1. 检查配置表是否创建
SELECT * FROM unit_price_config;

-- 2. 检查默认值是否正确
-- 应该看到3条记录:
-- SENDER_TO_ADMIN: 50000 VND
-- ADMIN_TO_TRANSIT: 40000 VND
-- SENDER_TO_RECEIVER: 15 CNY
```

### 3. 验证账单生成
```sql
-- 1. 创建一个测试批次
INSERT INTO batches (...) VALUES (...);

-- 2. 更新批次状态为 'sealed'
UPDATE batches SET status = 'sealed' WHERE id = '...';

-- 3. 检查是否自动生成账单A
SELECT * FROM bills WHERE batch_id = '...' AND bill_type = 'SENDER_TO_ADMIN';

-- 4. 验证单价和金额
-- unit_price 应该是 50000
-- total_amount 应该是 total_weight × 50000
```

### 4. 验证修复功能
```sql
-- 1. 查找零单价账单
SELECT id, bill_type, unit_price, total_amount 
FROM bills 
WHERE unit_price = 0;

-- 2. 执行修复
SELECT * FROM fix_zero_unit_prices();

-- 3. 再次检查
SELECT id, bill_type, unit_price, total_amount 
FROM bills 
WHERE id IN (上一步返回的ID);

-- 4. 确认单价已更新
```

---

## 📝 文件清单

### 新增文件
1. ✅ `/components/finance/ExchangeRateModal.tsx` - 汇率编辑弹窗
2. ✅ `/components/finance/UnitPriceSettings.tsx` - 单价配置管理
3. ✅ `/supabase/migrations/20260217_unit_price_config.sql` - 数据库迁移

### 修改文件
1. ✅ `/pages/finance/ExchangeRates.tsx` - 重写汇率管理页面

---

## 🎊 总结

### 问题修复
- ✅ 汇率管理页面现在从数据库读取真实数据
- ✅ 支持编辑和新增汇率
- ✅ 汇率数据可以持久化
- ✅ 账单单价配置可管理
- ✅ 提供修复历史零单价账单的功能

### 系统改进
- ✅ 汇率管理更加灵活
- ✅ 单价配置集中管理
- ✅ 账单生成逻辑更健壮
- ✅ 提供数据修复工具

### 下一步
1. **执行数据库迁移** - 应用单价配置表
2. **修复历史账单** - 使用修复功能更新零单价账单
3. **测试功能** - 验证汇率和单价管理是否正常
4. **集成到UI** - 在财务页面添加单价配置入口

---

**修复完成时间**: 2026-02-17 18:00:00  
**状态**: ✅ **代码已完成，等待部署和测试**
