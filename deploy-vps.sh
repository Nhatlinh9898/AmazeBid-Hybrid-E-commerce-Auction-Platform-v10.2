#!/bin/bash

# =========================================================================
# AmazeBid - Script Tự Động Thiết Lập & Triển Khai Backend Trên VPS (Ubuntu)
# Domain mục tiêu: api.amazebid.co (máy chủ ứng dụng chính: amazebid.co)
# Tương thích tốt nhất với: Ubuntu 20.04 LTS / 22.04 LTS / 24.04 LTS
# =========================================================================

# Khai báo màu sắc cho thông tin log hiển thị
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0;3m' # No Color
NC_BOLD='\033[1m'

echo -e "${BLUE}=====================================================================${NC}"
echo -e "${GREEN_BOLD}   BẮT ĐẦU CÀI ĐẶT & TRIỂN KHAI AMAZEBID BACKEND TRÊN MÁY CHỦ VPS   ${NC}"
echo -e "${BLUE}=====================================================================${NC}"

# 1. Yêu cầu quyền Root để thực thi
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[LỖI] Vui lòng chạy Script này bằng quyền ROOT (Sử dụng lệnh: sudo ./deploy-vps.sh)${NC}"
  exit 1
fi

# 2. Cập nhật hệ thống
echo -e "\n${YELLOW}[Bước 1/8] Đang cập nhật danh dách gói cài đặt Ubuntu...${NC}"
apt update && apt upgrade -y

# 3. Cài đặt các gói tiện ích và Nginx
echo -e "\n${YELLOW}[Bước 2/8] Cài đặt Nginx, Git, Curl, Certbot và tường lửa UFW...${NC}"
apt install -y git curl wget nginx certbot python3-certbot-nginx ufw htop

# 4. Cài đặt Node.js phiên bản 20 LTS và PM2 toàn cục
echo -e "\n${YELLOW}[Bước 3/8] Thiết lập Node.js LTS 20.x...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    echo -e "${GREEN}- Node.js đã được cài đặt sẵn trước đó: $(node -v)${NC}"
fi

echo -e "\n${YELLOW}Cài đặt trình quản lý tiến trình PM2 toàn cục...${NC}"
npm install -g pm2 yarn esbuild pnpm tsx

# 5. Cấu hình tường lửa bảo mật (UFW Firewall)
echo -e "\n${YELLOW}[Bước 4/8] Cấu hình bảo mật hệ thống thông qua tường lửa UFW...${NC}"
echo -e "${BLUE}- Cho phép kết nối qua SSH (Cổng 22)${NC}"
ufw allow 22/tcp
echo -e "${BLUE}- Cho phép lưu lượng Web (HTTP - Cổng 80 và HTTPS - Cổng 443)${NC}"
ufw allow 80/tcp
ufw allow 443/tcp
echo -e "${BLUE}- Bật dịch vụ tường lửa:${NC}"
ufw --force enable
echo -e "${GREEN}✓ Tường lửa UFW đã được thiết lập thành công!${NC}"

# 6. Thiết lập thư mục chứa mã nguồn ứng dụng
echo -e "\n${YELLOW}[Bước 5/8] Cấu hình thư mục làm việc và mã nguồn tại /var/www/amazebid-api...${NC}"
APP_DIR="/var/www/amazebid-api"
mkdir -p "$APP_DIR"

# Kiểm tra nếu thư mục hiện tại là repo cloned
if [ -f "package.json" ] && [ -f "server.ts" ]; then
    echo -e "${BLUE}- Sao chép mã nguồn hiện tại vào thư mục chạy hệ thống /var/www/amazebid-api...${NC}"
    cp -r * "$APP_DIR/" 2>/dev/null || true
    cp .* "$APP_DIR/" 2>/dev/null || true
else
    echo -e "${YELLOW}- Thư mục hiện tại không chứa mã nguồn, tiến hành kéo mã nguồn mới nhất từ GitHub...${NC}"
    cd "$APP_DIR" || exit
    git clone https://github.com/Nhatlinh9898/AmazeBid-Hybrid-E-commerce-Auction-Platform-v10.git .
fi

cd "$APP_DIR" || exit

# Khởi tạo cài đặt thư viện
echo -e "\n${YELLOW}Đang cài đặt các thư viện Node.js nội bộ...${NC}"
npm install

# Build dự án (Trình biên dịch ESBuild sẽ chạy song song bundle code server)
echo -e "\n${YELLOW}Tiến hành biên dịch Code TypeScript sang CJS (Production Optimized)...${NC}"
npm run build

# 7. Cấu hình Reverse Proxy Nginx
echo -e "\n${YELLOW}[Bước 6/8] Cài đặt cấu hình tên miền cho Nginx (api.amazebid.co)...${NC}"
NGINX_CONF="/etc/nginx/sites-available/api.amazebid.co"
NGINX_ENABLED="/etc/nginx/sites-enabled/api.amazebid.co"

# Nếu tệp cấu hình không tồn tại trong thư mục cài đặt, tạo tệp mẫu
if [ -f "nginx/api.amazebid.co.conf" ]; then
    cp nginx/api.amazebid.co.conf "$NGINX_CONF"
else
    cat << 'EOF' > "$NGINX_CONF"
server {
    listen 80;
    listen [::]:80;
    server_name api.amazebid.co;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
fi

# Tạo liên kết tượng trưng (Symlink) để kích hoạt tên miền trên Nginx
if [ ! -L "$NGINX_ENABLED" ]; then
    ln -s "$NGINX_CONF" "$NGINX_ENABLED" 2>/dev/null || true
fi

# Xóa cấu hình mặc định (default) tránh xung đột
rm -f /etc/nginx/sites-enabled/default

# Kiểm tra cú pháp cấu hình Nginx
if nginx -t; then
    echo -e "${GREEN}✓ Kiểm tra cú pháp cấu hình Nginx thành công. Khởi động lại dịch vụ...${NC}"
    systemctl restart nginx
else
    echo -e "${RED}[LỖI] Nginx cấu hình bị phát hiện lỗi cú pháp. Vui lòng kiểm tra lại.${NC}"
fi

# 8. Chạy ứng dụng Backend thông qua PM2 Cluster
echo -e "\n${YELLOW}[Bước 7/8] Đang kích hoạt máy chủ Backend chạy nền ổn định qua PM2...${NC}"
pm2 delete amazebid-backend 2>/dev/null || true

if [ -f "ecosystem.config.cjs" ]; then
    pm2 start ecosystem.config.cjs --env production
else
    pm2 start dist/server.cjs --name "amazebid-backend" -i max
fi

# Đăng ký PM2 tự khởi chạy khi khởi động lại hệ thống máy chủ (boot restart)
pm2 startup | tail -n 1 > /tmp/pm2_startup.sh
chmod +x /tmp/pm2_startup.sh
/tmp/pm2_startup.sh 2>/dev/null || true
pm2 save
echo -e "${GREEN}✓ Tiến trình Node Express của bạn đã được quản lý và bảo vệ hoàn toàn bởi PM2.${NC}"

# 9. Đăng ký & Tự động gia hạn chứng chỉ SSL Let's Encrypt
echo -e "\n${YELLOW}[Bước 8/8] Đăng ký chứng chỉ bảo mật HTTPS SSL cho: api.amazebid.co...${NC}"
echo -e "${YELLOW}Vui lòng đảm bảo rằng bạn ĐÃ CẤU HÌNH BẢN GHI A (Record A) trỏ tên miền api.amazebid.co về IP của VPS này trước khi tiếp tục.${NC}"
echo -e "Bạn có muốn cài đặt SSL Let's Encrypt miễn phí tự động ngay bây giờ không? (y/n)"
read -r -p "Lựa chọn của bạn: " confirm_ssl

if [[ "$confirm_ssl" =~ ^[Yy]$ ]]; then
    # Yêu cầu Certbot đăng ký chứng chỉ SSL HTTPS
    certbot --nginx -d api.amazebid.co --non-interactive --agree-tos --email Nhatlinhckm2016@gmail.com --redirect
    echo -e "${GREEN}✓ Chứng chỉ bảo mật SSL đã được cấp phát và tự động tải cấu hình trực tiếp vào Nginx!${NC}"
else
    echo -e "${YELLOW}Bỏ qua cài đặt SSL tự động. Bạn có thể tự kích hoạt về sau bằng lệnh: certbot --nginx -d api.amazebid.co${NC}"
fi

echo -e "\n${BLUE}=====================================================================${NC}"
echo -e "${GREEN_BOLD}    CÀI ĐẶT TRIỂN KHAI BACKEND CHO AMAZEBID ĐÃ HOÀN TẤT THÀNH CÔNG!   ${NC}"
echo -e "${BLUE}=====================================================================${NC}"
echo -e "${NC_BOLD}Các thông tin quản lý tiện ích cần ghi nhớ:${NC}"
echo -e "1. Xem nhật ký log chạy lỗi:        ${YELLOW}pm2 logs amazebid-backend${NC}"
echo -e "2. Kiểm tra trạng thái tiến trình:   ${YELLOW}pm2 status${NC}"
echo -e "3. Theo dõi tài nguyên hệ thống:    ${YELLOW}pm2 monit${NC}"
echo -e "4. Khởi động lại dịch vụ Backend:  ${YELLOW}pm2 restart amazebid-backend${NC}"
echo -e "5. Nơi lưu trữ mã nguồn chạy chính:  ${YELLOW}/var/www/amazebid-api/${NC}"
echo -e "6. Đường dẫn gọi API của bạn:       ${GREEN}https://api.amazebid.co/api/health${NC}"
echo -e "${BLUE}=====================================================================${NC}\n"
