# 🚨 SSH 暴力破解攻击实时报告

**报告时间**: 2026-02-17 17:36:40  
**威胁等级**: 🔴 **高危 - 正在遭受持续攻击**

---

## ⚠️ 紧急情况

你的服务器**正在遭受SSH暴力破解攻击**！

### 🎯 攻击者信息

| 攻击IP | 目标用户 | 攻击频率 | 威胁等级 |
|--------|---------|---------|---------|
| **165.22.194.103** | oracle | 持续攻击 | 🔴 高危 |
| **64.225.74.47** | git | 持续攻击 | 🔴 高危 |
| **130.12.181.185** | (多个用户) | 持续攻击 | 🔴 高危 |

### 📊 最近攻击时间线 (最近10分钟)

```
17:36:42 - 130.12.181.185 尝试登录
17:36:32 - 64.225.74.47 尝试登录 git 用户
17:36:24 - 165.22.194.103 尝试登录 oracle 用户
17:35:39 - 64.225.74.47 尝试登录 git 用户
17:35:35 - 165.22.194.103 尝试登录 oracle 用户
17:34:46 - 165.22.194.103 尝试登录 oracle 用户
17:34:44 - 64.225.74.47 尝试登录 git 用户
17:34:38 - 130.12.181.185 尝试登录
17:33:59 - 165.22.194.103 尝试登录 oracle 用户
17:33:52 - 64.225.74.47 尝试登录 git 用户
```

**攻击特征**:
- ⏱️ 平均每 **30-60秒** 尝试一次
- 🎯 目标用户: `oracle`, `git` (常见系统用户)
- 🔄 持续性攻击，未停止迹象

---

## ✅ 当前防护状态

### Fail2Ban 工作状态
- **服务状态**: 🟢 运行中 (自 15:50:30 启动)
- **历史拦截**: 已封禁 **32个IP**，阻止 **1,717次** 失败登录
- **当前配置**:
  - 失败次数阈值: 5次
  - 检测时间窗口: 5分钟
  - 封禁时长: 24小时

### ⚠️ 问题分析

**为什么这些IP还在攻击？**

可能原因：
1. **攻击刚开始** - 还未达到5次失败阈值
2. **IP轮换攻击** - 攻击者使用多个IP轮流攻击
3. **分布式攻击** - 来自不同地理位置的协同攻击

---

## 🛡️ 立即防护措施

### 方案1: 手动封禁当前攻击IP (立即生效)

```bash
# 封禁正在攻击的3个IP
sudo fail2ban-client set sshd banip 165.22.194.103
sudo fail2ban-client set sshd banip 64.225.74.47
sudo fail2ban-client set sshd banip 130.12.181.185

# 验证封禁状态
sudo fail2ban-client status sshd
```

### 方案2: 加强Fail2Ban规则 (推荐)

```bash
# 使用自动化脚本加固
sudo /www/wwwroot/hedui/.agent/ssh_hardening.sh
```

**该脚本会自动**:
- ✅ 将失败阈值从 5次 降低到 **3次**
- ✅ 将封禁时长从 24小时 延长到 **7天**
- ✅ 优化SSH配置，禁用root登录
- ✅ 添加当前IP到白名单

### 方案3: 紧急加固SSH配置

```bash
# 1. 禁用密码登录 (仅允许密钥)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# 2. 禁用root登录
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# 3. 修改SSH端口 (可选，需要更新防火墙)
# sudo sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config

# 4. 重新加载SSH配置
sudo systemctl reload sshd
```

---

## 📈 持续监控

### 实时监控命令

```bash
# 查看实时攻击日志
sudo tail -f /var/log/secure | grep "Failed password"

# 每5秒刷新监控面板
watch -n 5 /www/wwwroot/hedui/.agent/ssh_monitor.sh

# 查看Fail2Ban实时日志
sudo tail -f /var/log/fail2ban.log
```

### 设置告警 (可选)

```bash
# 创建监控cron任务，每小时检查
echo "0 * * * * /www/wwwroot/hedui/.agent/ssh_monitor.sh > /tmp/ssh_status.log" | sudo crontab -
```

---

## 🔍 IP 地理位置分析

| IP | 可能位置 | ISP类型 |
|-----|---------|---------|
| 165.22.194.103 | DigitalOcean数据中心 | 云服务器 |
| 64.225.74.47 | DigitalOcean数据中心 | 云服务器 |
| 130.12.181.185 | 未知 | 可能是VPS |

**分析**: 这些IP都来自云服务提供商，是典型的**自动化暴力破解攻击**特征。

---

## ✅ 推荐行动清单

### 🔴 立即执行 (5分钟内)
- [ ] 手动封禁当前攻击的3个IP
- [ ] 运行 `ssh_hardening.sh` 加固脚本
- [ ] 验证Fail2Ban正常工作

### 🟡 今天完成
- [ ] 配置SSH密钥认证
- [ ] 禁用密码登录
- [ ] 禁用root直接登录
- [ ] 修改SSH默认端口 (可选)

### 🟢 本周完成
- [ ] 设置监控告警
- [ ] 定期检查封禁日志
- [ ] 审查系统用户列表，删除不必要的用户 (如oracle, git)

---

## 📞 紧急联系

如果发现以下情况，请立即采取行动：
- ❌ 发现成功登录的可疑记录
- ❌ 系统性能异常下降
- ❌ 发现未知进程或文件
- ❌ Fail2Ban服务停止

**检查命令**:
```bash
# 检查最近成功登录
sudo last -20

# 检查当前登录用户
who

# 检查可疑进程
ps aux | grep -E "ssh|bash" | grep -v grep
```

---

## 📝 总结

**当前状态**: 🔴 **正在遭受攻击，但防护系统正常工作**

**风险评估**:
- ✅ Fail2Ban已启用并正常拦截
- ✅ 暂无成功入侵迹象
- ⚠️ 攻击持续进行中
- ⚠️ 需要加强防护措施

**建议优先级**: **立即执行方案1或方案2**

---

*自动生成于 2026-02-17 17:36:40*
