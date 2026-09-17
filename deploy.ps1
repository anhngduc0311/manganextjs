# ==============================================================================
# 🚀 TruyenKomi Monorepo - Windows PowerShell Docker Deployment Script
# Usage:
#   .\deploy.ps1                # Build & Start all services + Migrate + Seed
#   .\deploy.ps1 -Backup        # Dump PostgreSQL & upload to Cloudflare R2 bucket comics
#   .\deploy.ps1 -BackupsList   # List all backups in Cloudflare R2
#   .\deploy.ps1 -Restore <file># Restore PostgreSQL from Cloudflare R2 backup
#   .\deploy.ps1 -Crawl         # Trigger immediate MangaDex crawler sync
#   .\deploy.ps1 -CrawlerLogs   # View live logs of background crawler daemon
#   .\deploy.ps1 -Build         # Rebuild all containers from scratch
#   .\deploy.ps1 -Migrate       # Run database migrations
#   .\deploy.ps1 -Seed          # Seed sample data into database
#   .\deploy.ps1 -Logs          # View live logs of all services
#   .\deploy.ps1 -Down          # Stop and remove all containers
#   .\deploy.ps1 -Status        # Check status of running containers
# ==============================================================================

param (
    [switch]$Build,
    [switch]$Migrate,
    [switch]$Seed,
    [switch]$Backup,
    [switch]$BackupsList,
    [string]$Restore,
    [switch]$Logs,
    [switch]$CrawlerLogs,
    [switch]$Crawl,
    [switch]$CrawlAll,
    [switch]$Down,
    [switch]$Status
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    🚀 TRUYENKOMI MONOREPO - DOCKER DEPLOYMENT SYSTEM     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Check Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Lỗi: Docker chưa được cài đặt trên máy của bạn." -ForegroundColor Red
    exit 1
}

# Handle Down
if ($Down) {
    Write-Host "🛑 Đang dừng toàn bộ containers..." -ForegroundColor Yellow
    docker compose down
    Write-Host "✅ Đã dừng hệ thống thành công." -ForegroundColor Green
    exit 0
}

# Handle Backup to R2
if ($Backup) {
    Write-Host "☁️ Đang kết xuất và tải sao lưu database lên Cloudflare R2..." -ForegroundColor Cyan
    npx tsx scripts/r2-backup.ts backup
    exit 0
}

# Handle Backups List
if ($BackupsList) {
    Write-Host "📂 Danh sách các bản sao lưu trong Cloudflare R2:" -ForegroundColor Cyan
    npx tsx scripts/r2-backup.ts list
    exit 0
}

# Handle Restore from R2
if ($Restore) {
    Write-Host "⚠️ CẢNH BÁO: Chuẩn bị khôi phục database từ file '$Restore'." -ForegroundColor Yellow
    $confirm = Read-Host "👉 Bạn có chắc chắn muốn khôi phục không? (y/n)"
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        npx tsx scripts/r2-backup.ts restore $Restore
    } else {
        Write-Host "Đã hủy khôi phục." -ForegroundColor Yellow
    }
    exit 0
}

# Handle Logs
if ($Logs) {
    Write-Host "📜 Đang xem live logs của hệ thống (Nhấn Ctrl+C để thoát)..." -ForegroundColor Cyan
    docker compose logs -f --tail=100
    exit 0
}

# Handle Crawler Logs
if ($CrawlerLogs) {
    Write-Host "🤖 Đang xem live logs của Crawler Daemon (Nhấn Ctrl+C để thoát)..." -ForegroundColor Cyan
    docker compose logs -f --tail=100 crawler
    exit 0
}

# Handle Immediate Crawl
if ($Crawl) {
    Write-Host "⚡ Đang kích hoạt cào truyện MangaDex mới nhất..." -ForegroundColor Cyan
    docker compose exec -T crawler npx tsx scripts/crawl-mangadex.ts --mode=updates --updates-limit=20
    Write-Host "✅ Cào truyện hoàn tất!" -ForegroundColor Green
    exit 0
}

# Handle Full Backlog Crawl
if ($CrawlAll) {
    Write-Host "⚡ Đang kích hoạt cào toàn bộ kho truyện MangaDex tiếng Việt..." -ForegroundColor Cyan
    docker compose exec -T crawler npx tsx scripts/crawl-mangadex.ts --all --mode=backlog
    Write-Host "✅ Cào kho truyện hoàn tất!" -ForegroundColor Green
    exit 0
}

# Handle Status
if ($Status) {
    Write-Host "📊 Trạng thái các container:" -ForegroundColor Cyan
    docker compose ps
    exit 0
}

# Handle Migrate
if ($Migrate) {
    Write-Host "🔄 Đang chạy Prisma Database Migrations trong container..." -ForegroundColor Cyan
    docker compose exec -T api npm run db:migrate --workspace=@truyenkomi/database
    Write-Host "✅ Database migration hoàn tất!" -ForegroundColor Green
    exit 0
}

# Handle Seed
if ($Seed) {
    Write-Host "🌱 Đang seed dữ liệu mẫu vào PostgreSQL..." -ForegroundColor Cyan
    docker compose exec -T api npm run db:seed --workspace=@truyenkomi/database
    Write-Host "✅ Seed dữ liệu hoàn tất!" -ForegroundColor Green
    exit 0
}

# Ensure .env exists
if (-not (Test-Path .env)) {
    if (Test-Path .env.example) {
        Write-Host "⚠️ Chưa tìm thấy .env, đang sao chép từ .env.example..." -ForegroundColor Yellow
        Copy-Item .env.example .env
        Write-Host "✅ Đã tạo file .env thành công." -ForegroundColor Green
    }
}

# Start containers
if ($Build) {
    Write-Host "🔨 Đang build lại Docker images..." -ForegroundColor Cyan
    docker compose build --no-cache
}

Write-Host "📦 Đang khởi động 6 container (Postgres, Redis, Meilisearch, NestJS API, Next.js Web, Crawler)..." -ForegroundColor Blue
docker compose up -d --build

Write-Host "⏳ Đang chờ PostgreSQL khởi động..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Run Migration
Write-Host "🔄 Đang tự động chạy Prisma Database Migrations..." -ForegroundColor Cyan
try {
    docker compose exec -T api npm run db:migrate --workspace=@truyenkomi/database
} catch {
    Write-Host "⚠️ Migration notice" -ForegroundColor DarkGray
}

Write-Host "`n🎉 HỆ THỐNG TRUYENKOMI ĐÃ KHỞI CHẠY THÀNH CÔNG TRÊN DOCKER!`n" -ForegroundColor Green
Write-Host "Các cổng dịch vụ:" -ForegroundColor White
Write-Host "  🌐 Next.js Frontend:     http://localhost:3000" -ForegroundColor Cyan
Write-Host "  🚀 NestJS REST API:      http://localhost:3001" -ForegroundColor Cyan
Write-Host "  📚 Swagger API Docs:     http://localhost:3001/api/docs" -ForegroundColor Cyan
Write-Host "  🤖 Crawler Daemon:       Tự động đồng bộ MangaDex ngầm mỗi 10 phút" -ForegroundColor Cyan
Write-Host "  🔍 Meilisearch:          http://localhost:7700" -ForegroundColor Cyan
Write-Host "  🗄️ PostgreSQL Database:  localhost:5432" -ForegroundColor Cyan
Write-Host "  ⚡ Redis Cache:          localhost:6379" -ForegroundColor Cyan

Write-Host "`nLệnh quản trị tiện ích:" -ForegroundColor White
Write-Host "  - ☁️ Sao lưu DB lên R2:    .\deploy.ps1 -Backup" -ForegroundColor Yellow
Write-Host "  - 📂 Danh sách sao lưu:    .\deploy.ps1 -BackupsList" -ForegroundColor Yellow
Write-Host "  - 🔄 Khôi phục DB từ R2:   .\deploy.ps1 -Restore <filename>" -ForegroundColor Yellow
Write-Host "  - 📜 Xem logs toàn bộ:     .\deploy.ps1 -Logs" -ForegroundColor Yellow
Write-Host "  - 🤖 Xem logs Crawler:     .\deploy.ps1 -CrawlerLogs" -ForegroundColor Yellow
Write-Host "  - ⚡ Cào truyện mới ngay:  .\deploy.ps1 -Crawl" -ForegroundColor Yellow
Write-Host "  - 📊 Xem trạng thái:       .\deploy.ps1 -Status" -ForegroundColor Yellow
Write-Host "  - 🛑 Dừng hệ thống:        .\deploy.ps1 -Down" -ForegroundColor Yellow
