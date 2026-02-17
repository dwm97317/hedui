#!/bin/bash

# SSH 安全监控脚本
# 用途: 实时监控SSH安全状态和攻击情况

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          SSH 安全防护实时监控面板                          ║${NC}"
echo -e "${CYAN}║          更新时间: $(date '+%Y-%m-%d %H:%M:%S')                    ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Fail2Ban 服务状态
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}[1] Fail2Ban 服务状态${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if systemctl is-active --quiet fail2ban; then
    echo -e "状态: ${GREEN}● 运行中${NC}"
    uptime=$(systemctl show fail2ban --property=ActiveEnterTimestamp --value)
    echo -e "启动时间: $uptime"
else
    echo -e "状态: ${RED}● 已停止${NC}"
fi

echo ""

# 2. SSH Jail 详细状态
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}[2] SSH 防护统计${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if command -v fail2ban-client &> /dev/null; then
    sshd_status=$(sudo fail2ban-client status sshd 2>/dev/null)
    
    current_failed=$(echo "$sshd_status" | grep "Currently failed" | awk '{print $4}')
    total_failed=$(echo "$sshd_status" | grep "Total failed" | awk '{print $4}')
    current_banned=$(echo "$sshd_status" | grep "Currently banned" | awk '{print $4}')
    total_banned=$(echo "$sshd_status" | grep "Total banned" | awk '{print $4}')
    
    echo -e "当前失败尝试: ${YELLOW}$current_failed${NC} 次"
    echo -e "历史失败总数: ${RED}$total_failed${NC} 次"
    echo -e "当前封禁IP数: ${RED}$current_banned${NC} 个"
    echo -e "历史封禁总数: ${YELLOW}$total_banned${NC} 个"
else
    echo -e "${RED}Fail2Ban未安装${NC}"
fi

echo ""

# 3. 当前被封禁的IP列表
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}[3] 当前封禁IP列表 (最近10个)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

banned_ips=$(echo "$sshd_status" | grep "Banned IP list" | cut -d: -f2)

if [ -n "$banned_ips" ]; then
    echo "$banned_ips" | tr ' ' '\n' | head -10 | nl -w2 -s'. '
    
    total_count=$(echo "$banned_ips" | wc -w)
    if [ "$total_count" -gt 10 ]; then
        echo -e "${CYAN}... 还有 $((total_count - 10)) 个IP被封禁${NC}"
    fi
else
    echo -e "${GREEN}暂无封禁IP${NC}"
fi

echo ""

# 4. 最近的攻击日志
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}[4] 最近的SSH登录失败记录 (最近5条)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -f /var/log/secure ]; then
    sudo grep "Failed password" /var/log/secure | tail -5 | while read line; do
        timestamp=$(echo "$line" | awk '{print $1, $2, $3}')
        ip=$(echo "$line" | grep -oP '\d+\.\d+\.\d+\.\d+' | head -1)
        user=$(echo "$line" | grep -oP 'for (invalid user )?\K\w+' | head -1)
        echo -e "${RED}●${NC} $timestamp - 用户: ${YELLOW}$user${NC} - IP: ${RED}$ip${NC}"
    done
else
    echo -e "${YELLOW}日志文件不存在${NC}"
fi

echo ""

# 5. SSH 服务状态
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}[5] SSH 服务状态${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if systemctl is-active --quiet sshd; then
    echo -e "状态: ${GREEN}● 运行中${NC}"
    
    # 当前SSH连接数
    ssh_connections=$(who | grep -c pts)
    echo -e "当前SSH连接数: ${CYAN}$ssh_connections${NC}"
    
    # SSH端口
    ssh_port=$(sudo grep "^Port" /etc/ssh/sshd_config 2>/dev/null | awk '{print $2}')
    if [ -z "$ssh_port" ]; then
        ssh_port="22 (默认)"
    fi
    echo -e "监听端口: ${CYAN}$ssh_port${NC}"
else
    echo -e "状态: ${RED}● 已停止${NC}"
fi

echo ""

# 6. 当前活跃的SSH会话
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}[6] 当前活跃SSH会话${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

who | while read line; do
    user=$(echo "$line" | awk '{print $1}')
    terminal=$(echo "$line" | awk '{print $2}')
    time=$(echo "$line" | awk '{print $3, $4}')
    ip=$(echo "$line" | grep -oP '\(\K[^\)]+')
    
    if [ -n "$ip" ]; then
        echo -e "${GREEN}●${NC} 用户: ${CYAN}$user${NC} | 终端: $terminal | 时间: $time | IP: ${YELLOW}$ip${NC}"
    else
        echo -e "${GREEN}●${NC} 用户: ${CYAN}$user${NC} | 终端: $terminal | 时间: $time | IP: ${YELLOW}本地${NC}"
    fi
done

echo ""

# 7. 快捷操作提示
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}[7] 快捷操作命令${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${CYAN}查看详细状态:${NC}     sudo fail2ban-client status sshd"
echo -e "${CYAN}手动封禁IP:${NC}       sudo fail2ban-client set sshd banip <IP>"
echo -e "${CYAN}手动解封IP:${NC}       sudo fail2ban-client set sshd unbanip <IP>"
echo -e "${CYAN}查看实时日志:${NC}     sudo tail -f /var/log/secure"
echo -e "${CYAN}重新加载配置:${NC}     sudo fail2ban-client reload"

echo ""
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
