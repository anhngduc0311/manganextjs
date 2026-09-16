#!/usr/bin/env bash
# ==============================================================================
# TruyenKomi - Automated Deployment Script for Ubuntu / Linux (Docker)
# ==============================================================================
# Usage:
#   ./deploy.sh              : Full deployment (build, start, migrate, health check)
#   ./deploy.sh --seed       : Run database seed (Admin account + sample comics)
#   ./deploy.sh --migrate    : Run Prisma database migrations
#   ./deploy.sh --restart    : Restart all services
#   ./deploy.sh --logs [svc] : View logs (all or specific service, e.g. web, crawler)
#   ./deploy.sh --status     : Check status and resource usage of all containers
#   ./deploy.sh --down       : Stop and remove containers (data preserved in volumes)
#   ./deploy.sh --backup     : Backup PostgreSQL database to ./backups/
#   ./deploy.sh --restore <f>: Restore PostgreSQL database from backup file
#   ./deploy.sh --help       : Show help menu
# ==============================================================================

set -euo pipefail

# --- Colors for terminal output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# --- Project Paths & Config ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
ENV_EXAMPLE=".env.example"
BACKUP_DIR="./backups"

# --- Helper functions ---
log_info() {
    echo -e "${CYAN}ℹ️  [INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ [SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️  [WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}❌ [ERROR]${NC} $1" >&2
}

log_header() {
    echo -e "\n${PURPLE}${BOLD}======================================================${NC}"
    echo -e "${PURPLE}${BOLD}   $1${NC}"
    echo -e "${PURPLE}${BOLD}======================================================${NC}\n"
}

# --- Check Docker Command (supports docker compose plugin & docker-compose) ---
get_docker_compose_cmd() {
    if docker compose version >/dev/null 2>&1; then
        echo "docker compose"
    elif command -v docker-compose >/dev/null 2>&1; then
        echo "docker-compose"
    else
        echo ""
    fi
}

# --- Check Prerequisites ---
check_prerequisites() {
    log_info "Kiểm tra môi trường hệ thống..."

    # Check Docker
    if ! command -v docker >/dev/null 2>&1; then
        log_warning "Docker chưa được cài đặt trên hệ thống!"
        if command -v apt-get >/dev/null 2>&1; then
            echo -e "${YELLOW}Bạn có muốn tự động cài đặt Docker trên Ubuntu không? (y/N)${NC}"
            read -r install_docker
            if [[ "$install_docker" =~ ^[Yy]$ ]]; then
                log_info "Đang tiến hành cài đặt Docker..."
                sudo apt-get update
                sudo apt-get install -y ca-certificates curl gnupg lsb-release
                curl -fsSL https://get.docker.com | sudo sh
                sudo usermod -aG docker "$USER" || true
                log_success "Đã cài đặt Docker thành công! Vui lòng logout và login lại nếu cần quyền non-root."
            else
                log_error "Vui lòng cài đặt Docker trước khi tiếp tục: https://docs.docker.com/engine/install/ubuntu/"
                exit 1
            fi
        else
            log_error "Không tìm thấy Docker. Vui lòng cài đặt Docker trước khi chạy script."
            exit 1
        fi
    fi

    # Check Docker Daemon
    if ! docker info >/dev/null 2>&1; then
        log_warning "Docker daemon chưa khởi động hoặc user hiện tại không có quyền."
        log_info "Đang thử khởi động Docker service..."
        sudo systemctl start docker || true
        if ! docker info >/dev/null 2>&1; then
            log_error "Không thể kết nối đến Docker daemon. Vui lòng chạy: sudo systemctl start docker"
            exit 1
        fi
    fi

    # Check Docker Compose
    DOCKER_COMPOSE="$(get_docker_compose_cmd)"
    if [ -z "$DOCKER_COMPOSE" ]; then
        log_warning "Không tìm thấy docker compose plugin. Đang cài đặt..."
        if command -v apt-get >/dev/null 2>&1; then
            sudo apt-get update && sudo apt-get install -y docker-compose-plugin || sudo apt-get install -y docker-compose
            DOCKER_COMPOSE="$(get_docker_compose_cmd)"
        fi
        if [ -z "$DOCKER_COMPOSE" ]; then
            log_error "Không tìm thấy Docker Compose. Vui lòng cài đặt: https://docs.docker.com/compose/install/"
            exit 1
        fi
    fi

    log_success "Docker và Docker Compose ($DOCKER_COMPOSE) đã sẵn sàng."
}

# --- Setup .env file ---
setup_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        log_warning "Không tìm thấy tệp '$ENV_FILE'. Đang khởi tạo từ '$ENV_EXAMPLE'..."
        if [ -f "$ENV_EXAMPLE" ]; then
            cp "$ENV_EXAMPLE" "$ENV_FILE"
        else
            touch "$ENV_FILE"
        fi

        # Auto-generate secure random secrets
        if command -v openssl >/dev/null 2>&1; then
            RAND_SECRET=$(openssl rand -hex 32)
            RAND_CRAWLER=$(openssl rand -hex 24)
            
            # Replace placeholder secrets if present
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s/supersecretjwtkey_truyenkomi_fullstack_2026/$RAND_SECRET/g" "$ENV_FILE" || true
                sed -i '' "s/truyenkomi_crawler_internal_secret_token/$RAND_CRAWLER/g" "$ENV_FILE" || true
            else
                sed -i "s/supersecretjwtkey_truyenkomi_fullstack_2026/$RAND_SECRET/g" "$ENV_FILE" || true
                sed -i "s/truyenkomi_crawler_internal_secret_token/$RAND_CRAWLER/g" "$ENV_FILE" || true
            fi
        fi
        log_success "Đã tạo tệp '$ENV_FILE' với Secret Key ngẫu nhiên an toàn."
        log_info "Bạn có thể tùy chỉnh các cấu hình (Cloudflare R2, domain...) trong '$ENV_FILE'."
    else
        log_info "Đã phát hiện tệp cấu hình '$ENV_FILE'."
    fi
}

# --- Wait for Postgres DB ---
wait_for_db() {
    log_info "Đang chờ PostgreSQL khởi động và sẵn sàng nhận kết nối..."
    local retries=30
    local count=0
    until $DOCKER_COMPOSE exec -T postgres pg_isready -U postgres -d truyenkomi_db >/dev/null 2>&1 || [ $count -eq $retries ]; do
        sleep 2
        count=$((count + 1))
        echo -n "."
    done
    echo ""

    if [ $count -eq $retries ]; then
        log_error "Timeout: PostgreSQL không phản hồi sau $((retries * 2)) giây."
        $DOCKER_COMPOSE logs postgres
        exit 1
    fi
    log_success "PostgreSQL đã sẵn sàng."
}

# --- Run Database Migrations ---
run_migrations() {
    log_info "Đang chạy Prisma database migrations..."
    
    # Run migrations using the web service container
    if $DOCKER_COMPOSE run --rm --no-deps web npx prisma migrate deploy; then
        log_success "Prisma migrations đã được áp dụng thành công!"
    else
        log_error "Prisma migration thất bại. Dừng triển khai để tránh bỏ qua cập nhật dữ liệu."
        return 1
    fi
}

# --- Seed Database ---
seed_database() {
    log_info "Đang nạp dữ liệu mẫu và tạo tài khoản Admin mặc định (Prisma Seed)..."
    if $DOCKER_COMPOSE run --rm --no-deps web npm run db:seed; then
        log_success "Nạp dữ liệu mẫu thành công!"
        echo -e "\n${BOLD}🔑 Thông Tin Đăng Nhập Mặc Định:${NC}"
        echo -e "   - ${CYAN}Admin:${NC}  email: ${BOLD}admin@truyenkomi.local${NC}  | password: ${BOLD}Admin@123456${NC}"
        echo -e "   - ${CYAN}Reader:${NC} email: ${BOLD}reader@truyenkomi.local${NC} | password: ${BOLD}User@123456${NC}\n"
    else
        log_error "Nạp dữ liệu mẫu thất bại."
    fi
}

# --- Perform Health Check ---
check_health() {
    log_info "Đang kiểm tra trạng thái sức khỏe của ứng dụng (Health Check)..."
    sleep 5
    local retries=15
    local count=0
    local health_url="http://localhost:3000/api/health"

    while [ $count -lt $retries ]; do
        if command -v curl >/dev/null 2>&1; then
            http_code=$(curl -s -o /dev/null -w "%{http_code}" "$health_url" || echo "000")
            if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 503 ]; then
                log_success "Next.js Web Server phản hồi mã HTTP $http_code."
                curl -s "$health_url" | head -n 30 || true
                echo ""
                return 0
            fi
        fi
        sleep 3
        count=$((count + 1))
        echo -n "."
    done
    echo ""
    log_warning "Không thể kết nối ngay tới $health_url (Có thể container vẫn đang khởi động)."
    log_info "Xem logs bằng lệnh: $0 --logs web"
}

# --- Helper to run R2 backup utility ---
run_r2_backup_script() {
    local cmd="$1"
    shift
    if command -v npx >/dev/null 2>&1; then
        npx tsx scripts/r2-backup.ts "$cmd" "$@"
    else
        $DOCKER_COMPOSE run --rm --no-deps web npx tsx scripts/r2-backup.ts "$cmd" "$@"
    fi
}

# --- Backup Database (Local + Cloudflare R2) ---
backup_database() {
    log_header "Sao lưu Cơ Sở Dữ Liệu PostgreSQL"
    mkdir -p "$BACKUP_DIR"
    local timestamp
    timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="${BACKUP_DIR}/truyenkomi_backup_${timestamp}.sql"
    local compressed_file="${backup_file}.gz"

    log_info "1. Đang tạo bản sao lưu cục bộ tại '$backup_file'..."
    if $DOCKER_COMPOSE exec -T postgres pg_dump -U postgres truyenkomi_db > "$backup_file"; then
        # Compress backup
        gzip -f "$backup_file"
        local file_size
        file_size=$(du -h "$compressed_file" | cut -f1)
        log_success "Sao lưu cục bộ hoàn tất: $compressed_file ($file_size)"

        # 2. Upload to Cloudflare R2 if configured
        log_info "2. Đang kiểm tra cấu hình Cloudflare R2..."
        if [ -f "$ENV_FILE" ] && grep -q "R2_ACCESS_KEY_ID" "$ENV_FILE" && ! grep -q 'R2_ACCESS_KEY_ID="your_r2_access_key_id"' "$ENV_FILE"; then
            log_info "Phát hiện cấu hình Cloudflare R2. Đang đẩy bản sao lưu lên đám mây..."
            if run_r2_backup_script upload "$compressed_file"; then
                log_success "Bản sao lưu đã được lưu trữ an toàn trên Cloudflare R2!"
            else
                log_warning "Không thể tải lên Cloudflare R2 (Bản sao lưu cục bộ $compressed_file vẫn an toàn)."
            fi
        else
            log_info "Chưa cấu hình R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY trong '$ENV_FILE'. Bỏ qua đẩy lên Cloudflare R2."
            log_info "Bản sao lưu đã được lưu trữ cục bộ tại: $compressed_file"
        fi
    else
        log_error "Sao lưu cơ sở dữ liệu thất bại."
        exit 1
    fi
}

# --- List Cloudflare R2 Backups ---
list_r2_backups() {
    log_header "Danh Sách Bản Sao Lưu trên Cloudflare R2"
    run_r2_backup_script list
}

# --- Restore Database from Local File ---
restore_database() {
    local file="${1:-}"
    if [ -z "$file" ] || [ ! -f "$file" ]; then
        log_error "Vui lòng cung cấp đường dẫn tệp sao lưu hợp lệ (.sql hoặc .sql.gz)."
        echo "Ví dụ: $0 --restore ./backups/truyenkomi_backup_20260916_120000.sql.gz"
        exit 1
    fi

    log_header "Khôi phục Cơ Sở Dữ Liệu"
    log_warning "Thao tác này sẽ ghi đè toàn bộ dữ liệu hiện tại trong truyenkomi_db. Bạn có chắc chắn không? (y/N)"
    read -r confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        log_info "Đã hủy thao tác khôi phục."
        exit 0
    fi

    log_info "Đang khôi phục từ tệp '$file'..."
    if [[ "$file" == *.gz ]]; then
        gunzip -c "$file" | $DOCKER_COMPOSE exec -T postgres psql -U postgres truyenkomi_db
    else
        $DOCKER_COMPOSE exec -T postgres psql -U postgres truyenkomi_db < "$file"
    fi
    log_success "Khôi phục cơ sở dữ liệu thành công!"
}

# --- Restore Database from Cloudflare R2 ---
restore_r2_database() {
    local remote_key="${1:-}"
    if [ -z "$remote_key" ]; then
        log_error "Vui lòng cung cấp tên tệp sao lưu trên Cloudflare R2."
        echo "Ví dụ: $0 --restore-r2 truyenkomi_backup_20260916_120000.sql.gz"
        echo "Xem danh sách các bản sao lưu: $0 --list-r2"
        exit 1
    fi

    log_header "Khôi phục Cơ Sở Dữ Liệu từ Cloudflare R2"
    mkdir -p "$BACKUP_DIR"
    local base_name
    base_name=$(basename "$remote_key")
    local local_dest="${BACKUP_DIR}/${base_name}"

    log_info "1. Đang tải tệp '$remote_key' từ Cloudflare R2..."
    if run_r2_backup_script download "$remote_key" "$local_dest"; then
        log_success "Đã tải tệp sao lưu về: $local_dest"
        log_info "2. Bắt đầu khôi phục vào PostgreSQL..."
        restore_database "$local_dest"
    else
        log_error "Tải bản sao lưu từ Cloudflare R2 thất bại."
        exit 1
    fi
}

# --- Display Dashboard Summary ---
show_summary() {
    log_header "🚀 TruyenKomi Deployment Dashboard"
    
    echo -e "${BOLD}🌐 Địa chỉ truy cập ứng dụng:${NC}"
    echo -e "   - ${GREEN}Trang chủ Web:${NC}        http://localhost:3000"
    echo -e "   - ${GREEN}Bảng Quản Trị (Admin):${NC} http://localhost:3000/admin"
    echo -e "   - ${GREEN}Health Check API:${NC}      http://localhost:3000/api/health"
    echo -e "   - ${GREEN}Meilisearch:${NC}           http://localhost:7705"
    echo -e "   - ${GREEN}PostgreSQL Port:${NC}       localhost:5438"
    echo -e "   - ${GREEN}Redis Port:${NC}            localhost:6385"
    echo ""
    echo -e "${BOLD}🔑 Tài khoản quản trị mặc định (nếu đã nạp seed):${NC}"
    echo -e "   - Email:    ${CYAN}admin@truyenkomi.local${NC}"
    echo -e "   - Password: ${CYAN}Admin@123456${NC}"
    echo ""
    echo -e "${BOLD}🛠️ Các lệnh quản trị hữu ích:${NC}"
    echo -e "   - Xem logs thời gian thực:  ${YELLOW}$0 --logs${NC}"
    echo -e "   - Xem logs web server:      ${YELLOW}$0 --logs web${NC}"
    echo -e "   - Xem logs crawler:         ${YELLOW}$0 --logs crawler${NC}"
    echo -e "   - Kiểm tra trạng thái:      ${YELLOW}$0 --status${NC}"
    echo -e "   - Nạp dữ liệu mẫu:          ${YELLOW}$0 --seed${NC}"
    echo -e "   - Sao lưu dữ liệu (Local + R2): ${YELLOW}$0 --backup${NC}"
    echo -e "   - Xem danh sách backup trên R2: ${YELLOW}$0 --list-r2${NC}"
    echo -e "   - Dừng toàn bộ hệ thống:        ${YELLOW}$0 --down${NC}"
    echo ""
}

# --- Main Deployment Flow ---
deploy() {
    log_header "Khởi động Triển khai TruyenKomi trên Ubuntu Docker"
    
    check_prerequisites
    setup_env_file

    log_info "1. Đang build & pull Docker images..."
    $DOCKER_COMPOSE build --pull

    log_info "2. Đang khởi động các dịch vụ (PostgreSQL, Redis, Meilisearch, Web, Crawler)..."
    $DOCKER_COMPOSE up -d

    log_info "3. Chờ cơ sở dữ liệu sẵn sàng..."
    wait_for_db

    log_info "4. Đồng bộ cấu trúc cơ sở dữ liệu (Migrations)..."
    run_migrations

    log_info "5. Kiểm tra kết nối dịch vụ..."
    check_health

    show_summary
    log_success "🎉 Triển khai hoàn tất thành công!"
}

# --- Show Help Menu ---
show_help() {
    echo -e "${BOLD}TruyenKomi Deployment CLI Tool${NC}"
    echo ""
    echo "Sử dụng: $0 [TÙY CHỌN]"
    echo ""
    echo "Các tùy chọn có sẵn:"
    echo "  (không truyền tham số) : Triển khai toàn bộ (Build, Run, Migrate, Health Check)"
    echo "  --seed                 : Nạp dữ liệu mẫu (Admin account, comics, genres)"
    echo "  --migrate              : Chạy Prisma database migrations"
    echo "  --restart [service]    : Khởi động lại tất cả hoặc 1 dịch vụ cụ thể (web, crawler...)"
    echo "  --logs [service]       : Xem log thời gian thực (ví dụ: $0 --logs web)"
    echo "  --status               : Xem trạng thái và RAM/CPU của tất cả containers"
    echo "  --down                 : Dừng và gỡ bỏ containers (dữ liệu vẫn được giữ trong volume)"
    echo "  --clean                : Dừng containers và xóa các image rác / unused"
    echo "  --backup               : Sao lưu CSDL PostgreSQL cục bộ và tự động tải lên Cloudflare R2"
    echo "  --list-r2              : Liệt kê toàn bộ các bản sao lưu đang lưu trên Cloudflare R2"
    echo "  --restore <file.sql>   : Khôi phục CSDL từ file sao lưu cục bộ"
    echo "  --restore-r2 <file>    : Tải bản sao lưu từ Cloudflare R2 về và khôi phục vào CSDL"
    echo "  --help, -h             : Hiển thị bảng trợ giúp này"
    echo ""
}

# --- Entrypoint Router ---
DOCKER_COMPOSE="$(get_docker_compose_cmd || echo 'docker compose')"

ACTION="${1:-deploy}"

case "$ACTION" in
    deploy|up|start)
        deploy
        ;;
    --seed|seed)
        check_prerequisites
        seed_database
        ;;
    --migrate|migrate)
        check_prerequisites
        run_migrations
        ;;
    --restart|restart)
        check_prerequisites
        SERVICE="${2:-}"
        if [ -n "$SERVICE" ]; then
            log_info "Đang khởi động lại dịch vụ '$SERVICE'..."
            $DOCKER_COMPOSE restart "$SERVICE"
        else
            log_info "Đang khởi động lại toàn bộ dịch vụ..."
            $DOCKER_COMPOSE restart
        fi
        log_success "Khởi động lại thành công!"
        ;;
    --logs|logs)
        check_prerequisites
        SERVICE="${2:-}"
        if [ -n "$SERVICE" ]; then
            $DOCKER_COMPOSE logs -f "$SERVICE"
        else
            $DOCKER_COMPOSE logs -f
        fi
        ;;
    --status|status|ps)
        check_prerequisites
        echo -e "\n${BOLD}📊 Trạng thái các Container:${NC}"
        $DOCKER_COMPOSE ps
        echo -e "\n${BOLD}📈 Tài nguyên sử dụng (RAM / CPU):${NC}"
        docker stats --no-stream $(docker ps --format '{{.Names}}' | grep truyenkomi || true) 2>/dev/null || true
        ;;
    --down|down|stop)
        check_prerequisites
        log_info "Đang dừng toàn bộ containers..."
        $DOCKER_COMPOSE down
        log_success "Đã dừng các dịch vụ an toàn."
        ;;
    --clean|clean)
        check_prerequisites
        log_info "Đang dừng containers và dọn dẹp images không sử dụng..."
        $DOCKER_COMPOSE down
        docker image prune -f
        log_success "Dọn dẹp hoàn tất!"
        ;;
    --backup|backup|--backup-r2)
        check_prerequisites
        backup_database
        ;;
    --list-r2|list-r2)
        check_prerequisites
        list_r2_backups
        ;;
    --restore|restore)
        check_prerequisites
        restore_database "${2:-}"
        ;;
    --restore-r2|restore-r2)
        check_prerequisites
        restore_r2_database "${2:-}"
        ;;
    --help|-h|help)
        show_help
        ;;
    *)
        log_error "Tùy chọn không hợp lệ: '$ACTION'"
        show_help
        exit 1
        ;;
esac
