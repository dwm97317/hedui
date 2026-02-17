# 财务页面数据未更新 - 故障排查指南

## 问题描述
访问 `http://localhost:3002/#/finance/sender` 时，结算中心没有显示更新的计费数据。

## 可能原因及解决方案

### 1. 浏览器缓存问题 ⭐ 最常见
**症状**: 代码已更新，但页面显示旧数据

**解决方案**:
```bash
# 方法1: 硬刷新浏览器
# Windows/Linux: Ctrl + Shift + R
# Mac: Cmd + Shift + R

# 方法2: 清除浏览器缓存后刷新
# Chrome: F12 -> Network -> Disable cache (勾选) -> 刷新页面
```

### 2. 开发服务器热重载未生效
**症状**: 修改代码后，开发服务器没有自动重新编译

**解决方案**:
```bash
# 停止当前开发服务器 (Ctrl+C)
# 然后重新启动
cd /www/wwwroot/hedui
npm run dev
```

### 3. Store 数据未刷新
**症状**: 页面加载了，但数据是旧的

**解决方案**:
- 打开浏览器开发者工具 (F12)
- 查看 Console 标签页
- 查找 `Got raw data:` 日志，确认数据是否正确获取
- 如果没有日志，说明 `fetchBatches` 没有被调用

### 4. 数据库数据验证

**当前数据库状态**:
```
批次数量: 5个
账单数量: 10条
最新批次:
- BATCH-20260218-02 (250kg, received)
  - Bill A: 12,500,000 VND (已支付)
  - Bill B: 10,000,000 VND (待处理)
  - Bill C: 3,750 CNY (已支付)

- BATCH-20260218-01 (100.5kg, in_transit)
  - Bill A: 5,025,000 VND (待处理)
  - Bill B: 4,020,000 VND (待处理)
  - Bill C: 1,507.50 CNY (待处理)
```

## 快速诊断步骤

### Step 1: 检查网络请求
1. 打开 F12 开发者工具
2. 切换到 Network 标签
3. 刷新页面
4. 查找对 Supabase 的请求
5. 检查返回的数据是否包含最新的批次和账单

### Step 2: 检查 Console 日志
```javascript
// 在浏览器 Console 中执行
console.log('Current batches:', window.__ZUSTAND_STORE__?.getState?.()?.batches);
```

### Step 3: 强制重新获取数据
```javascript
// 在浏览器 Console 中执行
import { useFinanceStore } from './store/finance.store';
useFinanceStore.getState().fetchBatches();
```

## 预期显示效果

发货方结算中心应该显示:

### 应付总额卡片
- **物流费 (VND)**: 所有 status=pending 的 Bill A 总和
- **货款 (CNY)**: 所有 status=pending 的 Bill C 总和

### 批次列表
每个批次显示:
- 批次编号 (如 BATCH-20260218-01)
- 总重量
- 批次状态
- 两个账单卡片:
  - **账单 A**: 发货方 → 平台 (VND)
  - **账单 C**: 发货方 → 接收方 (CNY)

## 如果问题仍然存在

### 检查代码是否正确部署
```bash
# 确认文件已保存
ls -la /www/wwwroot/hedui/pages/finance/SenderFinance.tsx
ls -la /www/wwwroot/hedui/store/finance.store.ts

# 检查文件修改时间
stat /www/wwwroot/hedui/pages/finance/SenderFinance.tsx
```

### 重新构建项目
```bash
cd /www/wwwroot/hedui
rm -rf node_modules/.vite
npm run dev
```

### 检查 Supabase 连接
```bash
# 在浏览器 Console 执行
import { supabase } from './services/supabase';
const { data, error } = await supabase.from('batches').select('*').limit(1);
console.log('Supabase test:', { data, error });
```

## 联系支持
如果以上步骤都无法解决问题，请提供:
1. 浏览器 Console 的完整日志
2. Network 标签中 Supabase 请求的响应数据
3. 当前显示的页面截图
