#!/usr/bin/env bash
# ==============================================================================
# 🧠 TruyenKomi - Ubuntu 4GB Swap RAM Setup & Optimization Script
# Usage:
#   chmod +x scripts/setup-swap.sh
#   sudo ./scripts/setup-swap.sh
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "=========================================================="
echo "    🧠 CẤU HÌNH 4GB SWAP RAM CHO UBUNTU SERVER            "
echo "=========================================================="
echo -e "${NC}"

if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}❌ Lỗi: Vui lòng chạy script này với quyền root hoặc sudo: sudo ./scripts/setup-swap.sh${NC}"
    exit 1
fi

CURRENT_SWAP_KB=$(grep SwapTotal /proc/meminfo | awk '{print $2}' || echo "0")
CURRENT_SWAP_MB=$((CURRENT_SWAP_KB / 1024))

echo -e "Dung lượng Swap hiện tại: ${YELLOW}${CURRENT_SWAP_MB}MB${NC}"

if [ "$CURRENT_SWAP_MB" -ge 3800 ]; then
    echo -e "${GREEN}✅ Máy chủ đã có sẵn ${CURRENT_SWAP_MB}MB Swap RAM (đủ >= 4GB). Không cần tạo thêm.${NC}"
    free -h
    exit 0
fi

echo -e "${BLUE}⏳ Đang tiến hành tạo tệp Swap 4GB (/swapfile)...${NC}"

# Tắt swap cũ nếu có
if [ -f /swapfile ]; then
    swapoff /swapfile 2>/dev/null || true
    rm -f /swapfile
fi

# Cấp phát 4GB file
if command -v fallocate &> /dev/null; then
    fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096 status=progress
else
    dd if=/dev/zero of=/swapfile bs=1M count=4096 status=progress
fi

chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Ghi vào /etc/fstab để tự kích hoạt khi khởi động lại máy
if ! grep -q "/swapfile" /etc/fstab; then
    echo "/swapfile none swap sw 0 0" >> /etc/fstab
fi

# Tối ưu hóa Swappiness (vm.swappiness=10 để ưu tiên dùng RAM thật)
sysctl vm.swappiness=10
sysctl vm.vfs_cache_pressure=50

if ! grep -q "vm.swappiness" /etc/sysctl.conf; then
    echo "vm.swappiness=10" >> /etc/sysctl.conf
    echo "vm.vfs_cache_pressure=50" >> /etc/sysctl.conf
fi

echo -e "\n${GREEN}${BOLD}🎉 ĐÃ THIẾT LẬP VÀ KÍCH HOẠT 4GB SWAP RAM THÀNH CÔNG!${NC}\n"
echo -e "${CYAN}📊 Bảng phân bổ bộ nhớ máy chủ:${NC}"
free -h
echo ""
