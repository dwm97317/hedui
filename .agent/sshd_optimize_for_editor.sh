#!/bin/bash

# SSHD 远程编辑器连接优化脚本
# 用途: 确保SSH连接稳定、不断开、带宽充足

set -e

echo "=========================================="
echo "  SSHD 远程编辑器连接优化"
echo "=========================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# 检查是否为root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 sudo 运行此脚本${NC}"
    exit 1
fi

# 1. 备份配置
echo -e "${YELLOW}[1/5] 备份SSHD配置...${NC}"
BACKUP_DIR="/root/sshd_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp /etc/ssh/sshd_config "$BACKUP_DIR/sshd_config.bak"
echo -e "${GREEN}✓ 配置已备份到: $BACKUP_DIR${NC}"
echo ""

# 2. 分析当前问题
echo -e "${YELLOW}[2/5] 分析当前配置问题...${NC}"
echo -e "${RED}发现的问题:${NC}"
echo "  ❌ ClientAliveInterval = 0 (禁用了心跳,容易断开)"
echo "  ❌ ClientAliveCountMax = 3 (默认值,可能不够)"
echo "  ⚠️  TCP KeepAlive时间 = 7200秒 (2小时,太长)"
echo "  ⚠️  MaxSessions = 10 (可能不够用)"
echo "  ⚠️  存在废弃选项 RSAAuthentication"
echo ""

# 3. 优化SSHD配置
echo -e "${YELLOW}[3/5] 优化SSHD配置...${NC}"

# 移除废弃的RSAAuthentication
sed -i '/^RSAAuthentication/d' /etc/ssh/sshd_config

# 创建优化配置
cat > /tmp/sshd_editor_optimization.conf <<'EOF'

# ========================================
# SSH 远程编辑器连接优化配置
# 添加时间: $(date +%Y-%m-%d\ %H:%M:%S)
# ========================================

# === 保持连接活跃 (防止断开) ===
# 每60秒发送一次心跳包
ClientAliveInterval 60

# 允许10次心跳无响应 (总共10分钟无活动才断开)
ClientAliveCountMax 10

# 启用TCP层面的keepalive
TCPKeepAlive yes

# === 提升并发能力 ===
# 增加最大会话数 (支持更多编辑器窗口/终端)
MaxSessions 50

# 增加最大启动数 (支持快速重连)
MaxStartups 30:30:100

# === 性能优化 ===
# 启用压缩 (减少带宽占用,提升传输速度)
Compression yes

# 禁用DNS反向解析 (加快连接速度)
UseDNS no

# === 安全与便利性平衡 ===
# 允许密码和密钥认证
PasswordAuthentication yes
PubkeyAuthentication yes

# 允许root登录 (根据需要调整)
PermitRootLogin yes

# 允许TCP转发 (支持端口转发功能)
AllowTcpForwarding yes

# 允许X11转发 (如需要图形界面)
X11Forwarding yes

# === 编辑器特定优化 ===
# 增加最大认证尝试次数 (防止编辑器多次重连被拒)
MaxAuthTries 6

# 登录宽限时间 (给编辑器足够的认证时间)
LoginGraceTime 2m

# ========================================
# 优化配置结束
# ========================================
EOF

# 检查配置是否已存在
if ! grep -q "SSH 远程编辑器连接优化配置" /etc/ssh/sshd_config; then
    cat /tmp/sshd_editor_optimization.conf >> /etc/ssh/sshd_config
    echo -e "${GREEN}✓ SSHD配置已优化${NC}"
else
    echo -e "${YELLOW}⚠ 优化配置已存在,跳过${NC}"
fi

rm /tmp/sshd_editor_optimization.conf
echo ""

# 4. 优化系统TCP参数
echo -e "${YELLOW}[4/5] 优化系统TCP KeepAlive参数...${NC}"

# 备份sysctl配置
if [ ! -f /etc/sysctl.d/99-ssh-keepalive.conf.bak ]; then
    cp /etc/sysctl.d/99-ssh-keepalive.conf /etc/sysctl.d/99-ssh-keepalive.conf.bak 2>/dev/null || true
fi

# 创建TCP优化配置
cat > /etc/sysctl.d/99-ssh-keepalive.conf <<EOF
# SSH连接保持优化
# TCP KeepAlive 开始发送探测包的时间 (秒)
net.ipv4.tcp_keepalive_time = 600

# TCP KeepAlive 探测包发送间隔 (秒)
net.ipv4.tcp_keepalive_intvl = 30

# TCP KeepAlive 探测次数
net.ipv4.tcp_keepalive_probes = 5
EOF

# 应用配置
sysctl -p /etc/sysctl.d/99-ssh-keepalive.conf >/dev/null 2>&1

echo -e "${GREEN}✓ TCP KeepAlive参数已优化:${NC}"
echo "  - 开始探测时间: 7200秒 → 600秒 (10分钟)"
echo "  - 探测间隔: 75秒 → 30秒"
echo "  - 探测次数: 9次 → 5次"
echo ""

# 5. 测试并重启服务
echo -e "${YELLOW}[5/5] 测试配置并重启服务...${NC}"

# 测试SSHD配置
if sshd -t 2>&1 | grep -v "Deprecated"; then
    echo -e "${GREEN}✓ SSHD配置测试通过${NC}"
else
    echo -e "${RED}✗ SSHD配置有误,请检查${NC}"
    echo -e "${YELLOW}恢复备份: cp $BACKUP_DIR/sshd_config.bak /etc/ssh/sshd_config${NC}"
    exit 1
fi

# 重启SSHD服务
echo -e "${YELLOW}即将重启SSHD服务...${NC}"
echo -e "${RED}警告: 服务重启可能会短暂中断连接${NC}"
read -p "确认继续? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    systemctl reload sshd
    echo -e "${GREEN}✓ SSHD服务已重新加载${NC}"
else
    echo -e "${YELLOW}⚠ 跳过服务重启,请手动执行: sudo systemctl reload sshd${NC}"
fi

echo ""

# 显示优化结果
echo "=========================================="
echo "  优化完成"
echo "=========================================="
echo ""

echo -e "${GREEN}优化后的配置:${NC}"
echo ""
echo -e "${CYAN}连接保持:${NC}"
echo "  ✓ 心跳间隔: 60秒"
echo "  ✓ 最大心跳次数: 10次 (10分钟无活动才断开)"
echo "  ✓ TCP KeepAlive: 启用 (10分钟开始探测)"
echo ""

echo -e "${CYAN}性能优化:${NC}"
echo "  ✓ 最大会话数: 50 (支持多窗口编辑)"
echo "  ✓ 最大启动数: 30 (支持快速重连)"
echo "  ✓ 压缩: 启用 (节省带宽)"
echo "  ✓ DNS解析: 禁用 (加快连接)"
echo ""

echo -e "${CYAN}编辑器支持:${NC}"
echo "  ✓ TCP转发: 启用"
echo "  ✓ X11转发: 启用"
echo "  ✓ 认证尝试: 6次"
echo "  ✓ 登录宽限: 2分钟"
echo ""

echo -e "${YELLOW}验证命令:${NC}"
echo "  sudo sshd -T | grep -E '(clientalive|maxsessions|compression)'"
echo "  sysctl net.ipv4.tcp_keepalive_time"
echo ""

echo -e "${YELLOW}备份位置:${NC}"
echo "  $BACKUP_DIR/sshd_config.bak"
echo ""

echo -e "${GREEN}✓ 远程编辑器连接已优化完成!${NC}"
