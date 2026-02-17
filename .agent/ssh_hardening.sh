#!/bin/bash

# SSH 防暴力破解优化脚本
# 生成时间: 2026-02-17
# 用途: 一键加强SSH和Fail2Ban安全配置

set -e

echo "=========================================="
echo "  SSH 防暴力破解安全加固脚本"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 sudo 运行此脚本${NC}"
    exit 1
fi

# 备份原始配置
backup_configs() {
    echo -e "${YELLOW}[1/6] 备份原始配置文件...${NC}"
    
    if [ ! -d "/root/ssh_backup_$(date +%Y%m%d)" ]; then
        mkdir -p "/root/ssh_backup_$(date +%Y%m%d)"
    fi
    
    cp /etc/ssh/sshd_config "/root/ssh_backup_$(date +%Y%m%d)/sshd_config.bak"
    cp /etc/fail2ban/jail.local "/root/ssh_backup_$(date +%Y%m%d)/jail.local.bak" 2>/dev/null || true
    
    echo -e "${GREEN}✓ 配置已备份到: /root/ssh_backup_$(date +%Y%m%d)/${NC}"
}

# 优化SSH配置
optimize_ssh() {
    echo -e "${YELLOW}[2/6] 优化SSH配置...${NC}"
    
    # 创建临时配置
    cat > /tmp/ssh_hardening.conf <<EOF

# === SSH 安全加固配置 (添加于 $(date +%Y-%m-%d)) ===

# 禁止root直接登录 (建议使用普通用户+sudo)
PermitRootLogin no

# 最大认证尝试次数
MaxAuthTries 3

# 空闲超时设置
ClientAliveInterval 300
ClientAliveCountMax 2

# 禁用空密码
PermitEmptyPasswords no

# 禁用基于主机的认证
HostbasedAuthentication no

# 禁用X11转发 (如不需要图形界面)
X11Forwarding no

# 仅允许协议版本2
Protocol 2

# === 结束 ===
EOF

    # 检查是否已存在配置
    if ! grep -q "SSH 安全加固配置" /etc/ssh/sshd_config; then
        cat /tmp/ssh_hardening.conf >> /etc/ssh/sshd_config
        echo -e "${GREEN}✓ SSH配置已优化${NC}"
    else
        echo -e "${YELLOW}⚠ SSH配置已存在，跳过${NC}"
    fi
    
    rm /tmp/ssh_hardening.conf
}

# 加强Fail2Ban规则
strengthen_fail2ban() {
    echo -e "${YELLOW}[3/6] 加强Fail2Ban规则...${NC}"
    
    # 修改SSH jail配置
    sed -i 's/^maxretry = 5$/maxretry = 3/' /etc/fail2ban/jail.local
    sed -i 's/^findtime = 300$/findtime = 600/' /etc/fail2ban/jail.local
    sed -i 's/^bantime = 86400$/bantime = 604800/' /etc/fail2ban/jail.local
    
    echo -e "${GREEN}✓ Fail2Ban规则已加强:${NC}"
    echo "  - 失败次数: 5次 → 3次"
    echo "  - 检测时间: 5分钟 → 10分钟"
    echo "  - 封禁时长: 24小时 → 7天"
}

# 添加IP白名单
add_whitelist() {
    echo -e "${YELLOW}[4/6] 配置IP白名单...${NC}"
    
    # 获取当前SSH连接的IP
    CURRENT_IP=$(echo $SSH_CONNECTION | awk '{print $1}')
    
    if [ -n "$CURRENT_IP" ]; then
        echo -e "${GREEN}检测到当前SSH连接IP: $CURRENT_IP${NC}"
        
        # 添加到白名单
        if ! grep -q "$CURRENT_IP" /etc/fail2ban/jail.local; then
            sed -i "s/^ignoreip = 127.0.0.1\/8$/ignoreip = 127.0.0.1\/8 $CURRENT_IP/" /etc/fail2ban/jail.local
            echo -e "${GREEN}✓ 已将 $CURRENT_IP 添加到白名单${NC}"
        else
            echo -e "${YELLOW}⚠ IP已在白名单中${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ 未检测到SSH连接，跳过白名单配置${NC}"
    fi
}

# 测试配置
test_configs() {
    echo -e "${YELLOW}[5/6] 测试配置文件...${NC}"
    
    # 测试SSH配置
    if sshd -t; then
        echo -e "${GREEN}✓ SSH配置测试通过${NC}"
    else
        echo -e "${RED}✗ SSH配置有误，请检查${NC}"
        exit 1
    fi
    
    # 测试Fail2Ban配置
    if fail2ban-client -t; then
        echo -e "${GREEN}✓ Fail2Ban配置测试通过${NC}"
    else
        echo -e "${RED}✗ Fail2Ban配置有误，请检查${NC}"
        exit 1
    fi
}

# 重启服务
restart_services() {
    echo -e "${YELLOW}[6/6] 重启服务...${NC}"
    
    echo -e "${YELLOW}即将重启SSH和Fail2Ban服务...${NC}"
    echo -e "${RED}警告: SSH服务重启可能会短暂中断连接${NC}"
    read -p "确认继续? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # 重启Fail2Ban
        systemctl restart fail2ban
        echo -e "${GREEN}✓ Fail2Ban已重启${NC}"
        
        # 重启SSH (使用reload更安全)
        systemctl reload sshd
        echo -e "${GREEN}✓ SSH配置已重新加载${NC}"
    else
        echo -e "${YELLOW}⚠ 跳过服务重启，请手动执行:${NC}"
        echo "  sudo systemctl restart fail2ban"
        echo "  sudo systemctl reload sshd"
    fi
}

# 显示最终状态
show_status() {
    echo ""
    echo "=========================================="
    echo "  安全加固完成"
    echo "=========================================="
    echo ""
    
    echo -e "${GREEN}当前Fail2Ban状态:${NC}"
    fail2ban-client status sshd
    
    echo ""
    echo -e "${GREEN}SSH服务状态:${NC}"
    systemctl status sshd --no-pager -l | head -5
    
    echo ""
    echo -e "${YELLOW}后续建议:${NC}"
    echo "1. 配置SSH密钥认证后，禁用密码登录"
    echo "2. 考虑修改SSH默认端口(22 → 其他端口)"
    echo "3. 定期查看封禁日志: sudo fail2ban-client status sshd"
    echo "4. 备份文件位置: /root/ssh_backup_$(date +%Y%m%d)/"
}

# 主流程
main() {
    backup_configs
    optimize_ssh
    strengthen_fail2ban
    add_whitelist
    test_configs
    restart_services
    show_status
}

# 执行主流程
main
