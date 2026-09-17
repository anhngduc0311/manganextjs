#!/usr/bin/env bash
# ==============================================================================
# 🚀 TruyenKomi Monorepo - Ubuntu Server Docker Deployment Script
# Optimized for Ubuntu 20.04 / 22.04 / 24.04 LTS & Debian Linux
#
# Usage:
#   ./deploy.sh                  # Build & Start all services + Migrate + Seed
#   ./deploy.sh --swap           # Create & configure 4GB Swap RAM on Ubuntu
#   ./deploy.sh --backup         # Dump PostgreSQL & Upload to Cloudflare R2
#   ./deploy.sh --backups-list   # List all DB backups on Cloudflare R2
#   ./deploy.sh --restore <file> # Download & restore DB from Cloudflare R2
#   ./deploy.sh --cron-backup    # Setup automated daily backup at 03:00 AM
#   ./deploy.sh --crawl          # Run immediate MangaDex sync (updates mode)
#   ./deploy.sh --crawler-logs   # View live logs of background crawler daemon
#   ./deploy.sh --install        # Auto-install Docker, Compose & 4GB Swap
#   ./deploy.sh --build          # Rebuild all containers without cache
#   ./deploy.sh --migrate        # Run database migrations
#   ./deploy.sh --seed           # Seed sample data into database
#   ./deploy.sh --logs           # View live logs of all services
#   ./deploy.sh --down           # Stop and remove all containers
#   ./deploy.sh --status         # Check status and resource usage
#   ./deploy.sh --nginx          # Generate Nginx reverse proxy config for domain
# ==============================================================================

set -e

# Enable Docker BuildKit & Fast Parallel Layer Caching
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# ANSI Color Codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
echo "=========================================================="
echo "   🐧 TRUYENKOMI MONOREPO - UBUNTU SERVER DEPLOYMENT     "
echo "=========================================================="
echo -e "${NC}"

# Function: Setup 4GB Swap RAM on Ubuntu Server
setup_swap() {
    echo -e "${BLUE}🧠 Đang kiểm tra và cấu hình 4GB Swap RAM cho máy chủ Ubuntu...${NC}"

    CURRENT_SWAP_KB=$(grep SwapTotal /proc/meminfo | awk '{print $2}' || echo "0")
    CURRENT_SWAP_MB=$((CURRENT_SWAP_KB / 1024))

    if [ "$CURRENT_SWAP_MB" -ge 3800 ]; then
        echo -e "${GREEN}✅ Máy chủ đã có sẵn ${CURRENT_SWAP_MB}MB Swap RAM (đã đạt chuẩn >= 4GB).${NC}"
        return 0
    fi

    echo -e "${YELLOW}⚠️ Dung lượng Swap hiện tại: ${CURRENT_SWAP_MB}MB. Đang tạo 4GB Swap File...${NC}"

    # Disable old swap if active
    if [ -f /swapfile ]; then
        sudo swapoff /swapfile 2>/dev/null || true
        sudo rm -f /swapfile
    fi

    # Allocate 4GB file
    if command -v fallocate &> /dev/null; then
        sudo fallocate -l 4G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=4096 status=progress
    else
        sudo dd if=/dev/zero of=/swapfile bs=1M count=4096 status=progress
    fi

    # Set strict permissions
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile

    # Make swap permanent across reboots in /etc/fstab
    if ! grep -q "/swapfile" /etc/fstab; then
        echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab
    fi

    # Optimize Swappiness (10: use RAM first, prevent sluggish disk swapping)
    sudo sysctl vm.swappiness=10
    sudo sysctl vm.vfs_cache_pressure=50

    if ! grep -q "vm.swappiness" /etc/sysctl.conf; then
        echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
        echo "vm.vfs_cache_pressure=50" | sudo tee -a /etc/sysctl.conf
    fi

    echo -e "${GREEN}✅ Đã tạo và kích hoạt 4GB Swap RAM thành công!${NC}"
    echo -e "${CYAN}📊 Trạng thái bộ nhớ mới:${NC}"
    free -h
}

# Function: Detect and install Docker on Ubuntu/Debian
install_docker_ubuntu() {
    echo -e "${BLUE}📦 Đang cài đặt Docker và Docker Compose trên Ubuntu Server...${NC}"
    sudo apt-get update -y
    sudo apt-get install -y ca-certificates curl gnupg lsb-release ufw

    # Official Docker Installation Script
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm -f get-docker.sh

    # Add current user to docker group
    sudo usermod -aG docker "$USER" || true
    sudo systemctl enable docker
    sudo systemctl start docker

    echo -e "${GREEN}✅ Đã cài đặt Docker & Docker Compose thành công!${NC}"

    # Setup 4GB Swap automatically during initial install
    setup_swap

    echo -e "${YELLOW}ℹ️ Lưu ý: Nếu gặp lỗi quyền, vui lòng chạy: newgrp docker hoặc đăng nhập lại SSH.${NC}"
}

# Check argument for --install or --swap
if [ "$1" = "--install" ] || [ "$1" = "install" ]; then
    install_docker_ubuntu
    exit 0
fi

if [ "$1" = "--swap" ] || [ "$1" = "swap" ] || [ "$1" = "--setup-swap" ]; then
    setup_swap
    exit 0
fi

# Detect Sudo requirement for Docker
DOCKER_CMD="docker"
if ! docker info &> /dev/null; then
    if sudo docker info &> /dev/null; then
        DOCKER_CMD="sudo docker"
    else
        echo -e "${YELLOW}⚠️ Docker chưa được cài đặt hoặc chưa khởi động.${NC}"
        read -p "👉 Bạn có muốn tự động cài đặt Docker & 4GB Swap trên Ubuntu ngay bây giờ không? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_docker_ubuntu
            DOCKER_CMD="docker"
        else
            echo -e "${RED}❌ Hủy triển khai. Vui lòng cài đặt Docker trước: ./deploy.sh --install${NC}"
            exit 1
        fi
    fi
fi

# Determine Docker Compose Command
DOCKER_COMPOSE_CMD=""
if $DOCKER_CMD compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="$DOCKER_CMD compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif sudo docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="sudo docker compose"
else
    echo -e "${RED}❌ Lỗi: Docker Compose chưa được cài đặt.${NC}"
    echo "Chạy lệnh: ./deploy.sh --install để tự động cài đặt."
    exit 1
fi

# Auto-check swap if low
CURRENT_SWAP_KB=$(grep SwapTotal /proc/meminfo 2>/dev/null | awk '{print $2}' || echo "4194304")
if [ "$CURRENT_SWAP_KB" -lt 1048576 ] && command -v sudo &> /dev/null; then
    echo -e "${YELLOW}ℹ️ Phát hiện máy chủ chưa có Swap RAM đủ lớn. Tự động cấu hình 4GB Swap để tránh tràn RAM khi build...${NC}"
    setup_swap || true
fi

# Function: Generate Nginx Configuration
generate_nginx_config() {
    DOMAIN_NAME="truyenkomi.site"
    read -p "🌐 Nhập domain của bạn (Mặc định: truyenkomi.site): " USER_INPUT_DOMAIN
    DOMAIN_NAME=${USER_INPUT_DOMAIN:-$DOMAIN_NAME}

    NGINX_CONF_PATH="truyenkomi.nginx.conf"
    cat <<EOF > "$NGINX_CONF_PATH"
# ==============================================================================
# Nginx Reverse Proxy Configuration for TruyenKomi on Ubuntu Server
# Copy to: /etc/nginx/sites-available/truyenkomi
# Enable: sudo ln -sf /etc/nginx/sites-available/truyenkomi /etc/nginx/sites-enabled/
# Test:   sudo nginx -t && sudo systemctl reload nginx
# SSL:    sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME
# ==============================================================================

server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    # Maximum file upload size (for comic chapter images)
    client_max_body_size 100M;

    # Gzip Compression for text & json
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # 1. NestJS REST API & Swagger UI (/api/)
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Disable buffering for Server-Sent Events (SSE Realtime Readers)
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }

    # 2. Next.js 15 Web Application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}
EOF
    echo -e "${GREEN}✅ Đã tạo file cấu hình Nginx mẫu tại: ${BOLD}$NGINX_CONF_PATH${NC}"
    echo -e "Để kích hoạt trên Ubuntu Server:"
    echo -e "  1. ${YELLOW}sudo cp $NGINX_CONF_PATH /etc/nginx/sites-available/truyenkomi${NC}"
    echo -e "  2. ${YELLOW}sudo ln -sf /etc/nginx/sites-available/truyenkomi /etc/nginx/sites-enabled/${NC}"
    echo -e "  3. ${YELLOW}sudo nginx -t && sudo systemctl reload nginx${NC}"
    echo -e "  4. Cài SSL HTTPS miễn phí: ${YELLOW}sudo certbot --nginx -d $DOMAIN_NAME${NC}"
    exit 0
}

# Function: Setup Daily Cron Backup
setup_cron_backup() {
    SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/deploy.sh"
    CRON_JOB="0 3 * * * $SCRIPT_PATH --backup >> $(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/cron_backup.log 2>&1"

    (crontab -l 2>/dev/null | grep -v "$SCRIPT_PATH --backup" ; echo "$CRON_JOB") | crontab -
    echo -e "${GREEN}✅ Đã thiết lập Cronjob sao lưu cơ sở dữ liệu hàng ngày vào 03:00 sáng!${NC}"
    echo -e "   Bản sao lưu sẽ được nén và tự động tải lên Cloudflare R2 bucket 'comics'."
    exit 0
}

# Check argument for --nginx or --cron-backup
if [ "$1" = "--nginx" ] || [ "$1" = "nginx" ]; then
    generate_nginx_config
fi

if [ "$1" = "--cron-backup" ] || [ "$1" = "cron-backup" ]; then
    setup_cron_backup
fi

# Ensure .env exists
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo -e "${YELLOW}⚠️ Chưa tìm thấy file .env, đang sao chép từ .env.example...${NC}"
        cp .env.example .env
        echo -e "${GREEN}✅ Đã tạo file .env thành công.${NC}"
    fi
fi

# Action parsing
ACTION="${1:-up}"

case "$ACTION" in
    --backup|backup)
        echo -e "${CYAN}☁️ Đang tiến hành kết xuất và tải sao lưu lên Cloudflare R2...${NC}"
        npx tsx scripts/r2-backup.ts backup
        exit 0
        ;;
    --backups-list|backups-list|--list-backups)
        echo -e "${CYAN}📂 Danh sách bản sao lưu trên Cloudflare R2:${NC}"
        npx tsx scripts/r2-backup.ts list
        exit 0
        ;;
    --restore|restore)
        BACKUP_TARGET="$2"
        if [ -z "$BACKUP_TARGET" ]; then
            echo -e "${RED}❌ Vui lòng chỉ định tên file sao lưu: ./deploy.sh --restore <filename>${NC}"
            echo -e "   (Xem danh sách file: ${YELLOW}./deploy.sh --backups-list${NC})"
            exit 1
        fi
        echo -e "${YELLOW}⚠️ CẢNH BÁO: Bạn chuẩn bị khôi phục cơ sở dữ liệu từ file '$BACKUP_TARGET'.${NC}"
        read -p "👉 Bạn có chắc chắn muốn ghi đè dữ liệu hiện tại không? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npx tsx scripts/r2-backup.ts restore "$BACKUP_TARGET"
        else
            echo -e "${YELLOW}Đã hủy khôi phục.${NC}"
        fi
        exit 0
        ;;
    --down|down)
        echo -e "${YELLOW}🛑 Đang dừng toàn bộ containers...${NC}"
        $DOCKER_COMPOSE_CMD down
        echo -e "${GREEN}✅ Đã dừng hệ thống thành công.${NC}"
        exit 0
        ;;
    --logs|logs)
        echo -e "${CYAN}📜 Đang xem live logs của hệ thống (Nhấn Ctrl+C để thoát)...${NC}"
        $DOCKER_COMPOSE_CMD logs -f --tail=100
        exit 0
        ;;
    --crawler-logs|crawler-logs)
        echo -e "${CYAN}🤖 Đang xem live logs của Crawler Daemon (Nhấn Ctrl+C để thoát)...${NC}"
        $DOCKER_COMPOSE_CMD logs -f --tail=100 crawler
        exit 0
        ;;
    --crawl|crawl)
        echo -e "${CYAN}⚡ Đang kích hoạt tiến trình cào truyện MangaDex mới nhất...${NC}"
        $DOCKER_COMPOSE_CMD exec -T crawler npx tsx scripts/crawl-mangadex.ts --mode=updates --updates-limit=20
        echo -e "${GREEN}✅ Cào truyện hoàn tất!${NC}"
        exit 0
        ;;
    --crawl-all|crawl-all)
        echo -e "${CYAN}⚡ Đang kích hoạt cào toàn bộ kho truyện MangaDex tiếng Việt...${NC}"
        $DOCKER_COMPOSE_CMD exec -T crawler npx tsx scripts/crawl-mangadex.ts --all --mode=backlog
        echo -e "${GREEN}✅ Cào kho truyện hoàn tất!${NC}"
        exit 0
        ;;
    --status|status)
        echo -e "${CYAN}📊 Trạng thái các container & mức sử dụng tài nguyên RAM/CPU:${NC}"
        $DOCKER_COMPOSE_CMD ps
        echo ""
        $DOCKER_CMD stats --no-stream
        echo ""
        echo -e "${CYAN}🧠 Dung lượng Swap RAM:${NC}"
        free -h
        exit 0
        ;;
    --migrate|migrate)
        echo -e "${CYAN}🔄 Đang chạy Prisma Database Migrations trong container API...${NC}"
        $DOCKER_COMPOSE_CMD exec -T api npm run db:migrate --workspace=@truyenkomi/database
        echo -e "${GREEN}✅ Database migration hoàn tất!${NC}"
        exit 0
        ;;
    --seed|seed)
        echo -e "${CYAN}🌱 Đang seed dữ liệu mẫu vào PostgreSQL...${NC}"
        $DOCKER_COMPOSE_CMD exec -T api npm run db:seed --workspace=@truyenkomi/database
        echo -e "${GREEN}✅ Seed dữ liệu hoàn tất!${NC}"
        exit 0
        ;;
    --build|build)
        echo -e "${CYAN}🔨 Đang build lại toàn bộ Docker images không dùng cache...${NC}"
        $DOCKER_COMPOSE_CMD build --no-cache
        ;;
esac

# Start All Services
echo -e "${BLUE}📦 Đang khởi động 6 dịch vụ (PostgreSQL, Redis, Meilisearch, NestJS API, Next.js Web, Crawler Daemon)...${NC}"
$DOCKER_COMPOSE_CMD up -d --build

# Wait for PostgreSQL
echo -e "${YELLOW}⏳ Đang kiểm tra kết nối PostgreSQL...${NC}"
RETRY_COUNT=0
MAX_RETRIES=35
until $DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U postgres -d truyenkomi &> /dev/null || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
    echo -ne "."
    sleep 1
    RETRY_COUNT=$((RETRY_COUNT+1))
done
echo ""

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ Quá thời gian chờ PostgreSQL khởi động. Kiểm tra: docker compose logs postgres${NC}"
    exit 1
fi
echo -e "${GREEN}✅ PostgreSQL đã sẵn sàng!${NC}"

# Auto Run Migrations
echo -e "${CYAN}🔄 Đang tự động kiểm tra và chạy Prisma Database Migrations...${NC}"
$DOCKER_COMPOSE_CMD exec -T api npm run db:migrate --workspace=@truyenkomi/database || true

# Get Server Public IP
SERVER_IP=$(curl -s -4 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}' || echo "localhost")

echo -e "\n${GREEN}${BOLD}🎉 HỆ THỐNG TRUYENKOMI ĐÃ KHỞI CHẠY THÀNH CÔNG TRÊN UBUNTU SERVER!${NC}\n"

echo -e "${BOLD}Các cổng dịch vụ đang hoạt động:${NC}"
echo -e "  🌐 ${CYAN}Next.js Frontend:${NC}     http://${SERVER_IP}:3000  (hoặc http://localhost:3000)"
echo -e "  🚀 ${CYAN}NestJS REST API:${NC}      http://${SERVER_IP}:3001  (hoặc http://localhost:3001)"
echo -e "  📚 ${CYAN}Swagger API Docs:${NC}     http://${SERVER_IP}:3001/api/docs"
echo -e "  🤖 ${CYAN}Crawler Daemon:${NC}       Tự động đồng bộ MangaDex ngầm mỗi 10 phút"
echo -e "  🔍 ${CYAN}Meilisearch:${NC}          http://${SERVER_IP}:7700"
echo -e "  🗄️ ${CYAN}PostgreSQL Database:${NC}  localhost:5432"
echo -e "  ⚡ ${CYAN}Redis Cache:${NC}          localhost:6379"

echo -e "\n${BOLD}Các lệnh quản trị tiện ích trên Ubuntu Server:${NC}"
echo -e "  - 🧠 Cấu hình 4GB Swap RAM:       ${YELLOW}./deploy.sh --swap${NC}"
echo -e "  - ☁️ Sao lưu DB lên Cloudflare R2: ${YELLOW}./deploy.sh --backup${NC}"
echo -e "  - 📂 Xem danh sách bản sao lưu:   ${YELLOW}./deploy.sh --backups-list${NC}"
echo -e "  - 🔄 Khôi phục DB từ R2:           ${YELLOW}./deploy.sh --restore <filename>${NC}"
echo -e "  - ⏰ Thiết lập sao lưu tự động 3h: ${YELLOW}./deploy.sh --cron-backup${NC}"
echo -e "  - 📜 Xem logs toàn bộ:            ${YELLOW}./deploy.sh --logs${NC}"
echo -e "  - 🤖 Xem logs Crawler:            ${YELLOW}./deploy.sh --crawler-logs${NC}"
echo -e "  - ⚡ Cào truyện ngay lập tức:     ${YELLOW}./deploy.sh --crawl${NC}"
echo -e "  - 📊 Xem mức chiếm RAM/CPU:       ${YELLOW}./deploy.sh --status${NC}"
echo -e "  - 🛑 Dừng toàn bộ hệ thống:       ${YELLOW}./deploy.sh --down${NC}"
echo ""
