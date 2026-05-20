# Hướng Dẫn Chi Tiết Cấu Hình Kết Nối Tên Miền (amazebid.co) Cho Hệ Thống AmazeBid

Tài liệu này hướng dẫn chi tiết từng bước để cấu hình phân giải tên miền **amazebid.co** (đã mua tại Squarespace) trỏ về máy chủ VPS của bạn, thiết lập SSL (HTTPS) bảo mật và cấu hình môi trường giúp hệ thống hoạt động trơn tru từ Frontend đến Backend.

---

## Sơ Đồ Hoạt Động Của Hệ Thống

```
[Trình duyệt Người dùng] 
       │
       ├─► Truy cập https://amazebid.co ──► [Vercel hoặc VPS Frontend (Chứa Client App)]
       │
       └─► Gọi API https://api.amazebid.co ─► [Nginx Proxy (Cổng 443)] ─► [Node.js / Express (Cổng 3000 VPS)]
```

---

## Bước 1: Cấu Hình Bản Ghi DNS trên Squarespace Managed Domains

Bạn cần đăng nhập vào trang quản trị tên miền của mình tại địa chỉ:
👉 **[Squarespace Domain Management](https://account.squarespace.com/domains/managed/amazebid.co/dns/dns-settings)**

Sau đó thêm hoặc chỉnh sửa các bản ghi (DNS Records) sau đây:

| Loại Bản Ghi (Type) | Tên Máy Chủ (Host/Name) | Địa Chỉ Trỏ Đến (Data/Value) | TTL (Thời gian sống) | Ý Nghĩa |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` hoặc để trống | `123.456.789.123` *(Thay bằng IP máy chủ thật)* | `3600` hoặc Mặc định | Trỏ tên miền chính `amazebid.co` về máy chủ VPS của bạn. |
| **A** | `api` | `123.456.789.123` *(Thay bằng IP máy chủ thật)* | `3600` hoặc Mặc định | Trỏ tên miền phụ (subdomain) `api.amazebid.co` phụ trách API về VPS. |
| **CNAME** | `www` | `amazebid.co` | `3600` hoặc Mặc định | Cho phép người dùng truy cập bằng `www.amazebid.co`. |

> **⚠️ Lưu ý cực kỳ quan trọng:** Sau khi cấu hình trên Squarespace, có thể mất từ **5 phút đến 2 giờ** để hệ thống DNS toàn cầu cập nhật đầy đủ (quá trình này gọi là DNS Propagation). bạn có thể kiểm tra xem tên miền đã trỏ đúng IP chưa bằng cách gõ lệnh sau trong Terminal máy tính:
> ```bash
> ping api.amazebid.co
> ```

---

## Bước 2: Thiết Lập Biến Môi Trường `.env` Ở Server VPS

Trong thư mục gốc của dự án trên VPS `/var/www/amazebid-api/.env`, hãy đảm bảo các giá trị đã khớp chính xác với tên miền của bạn:

```env
# URL Frontend & API Subdomain hợp lệ
VITE_APP_URL=https://amazebid.co
VITE_API_URL=https://api.amazebid.co

# CORS cho phép Frontend gửi request lên Backend
CORS_ORIGIN=https://amazebid.co,https://www.amazebid.co

# Địa chỉ IP VPS và Cổng chạy Backend
VPS_SERVER_IP=123.456.789.123  # Thay bằng IP máy chủ thực tế của bạn
PORT=3000
NODE_ENV=production
```

---

## Bước 3: Triển Khai Nginx Làm Reverse Proxy Đảm Bảo Kết Nối Trơn Tru

Nginx đóng vai trò tiếp nhận các yêu cầu HTTPS trực tiếp từ người dùng thông qua tên miền `api.amazebid.co` (Cổng 443), giải mã SSL và chuyển tiếp (Proxy) về cổng nội bộ `3000` của Node.js Express đang chạy ẩn phía sau.

Nội dung cấu hình tối ưu nhất cho **Nginx** đã được lưu tại tệp `/nginx/api.amazebid.co.conf` trong dự án của bạn. Khi bạn chạy script tự động cài đặt trên VPS:

```bash
sudo ./deploy-vps.sh
```

Hệ thống sẽ tự động cấu hình Nginx liên kết đến tệp cấu hình đó.

### Những tính năng tối ưu có sắn trong file cấu hình Nginx:
1. **Hỗ trợ giao thức HTTP/2:** Tăng tốc độ load API và phản hồi bidding thời gian thực siêu nhanh.
2. **Cấu hình WebSocket (Socket.io) chuyên biệt:** Giúp duy trì kết nối bền vững cho luồng live stream và cập nhật giá đấu thầu liên tục không bị ngắt quãng giữa chừng.
3. **Giới hạn kích thước file upload (client_max_body_size 50M):** Giúp người bán đăng ảnh sản phẩm sắc nét dung lượng cao mà không bị chặn bởi giới hạn mặc định của Nginx (thường chỉ có 1MB).
4. **Header Bảo mật nghiêm ngặt:** Chống tấn công nhúng frame clickjacking, XSS và áp dụng chính sách HSTS cưỡng chế luôn luôn kết nối HTTPS.

---

## Bước 4: Kích Hoạt HTTPS Bảo Mật Trơn Tru (SSL Let's Encrypt)

Để trình duyệt không cảnh báo "Kết nối không an toàn" (gây lỗi chặn gọi API từ các ứng dụng thương mại điện tử hiện đại yêu cầu giao thức bảo mật cao), bạn cần đăng ký SSL miễn phí bằng Certbot.

Khi chạy script `./deploy-vps.sh`, hãy ấn **`Y`** khi được hỏi để hệ thống tự xử lý. Hoặc bạn có thể tự đăng ký thủ công bất kỳ lúc nào bằng lệnh sau trên VPS:

```bash
sudo certbot --nginx -d api.amazebid.co
```

Certbot sẽ:
- Xác thực bạn sở hữu tên miền đó.
- Tạo chứng chỉ SSL Let's Encrypt.
- Tự động thay đổi tệp cấu hình Nginx để mở cổng 443 thực tế và chuyển hướng tự động toàn bộ người dùng từ HTTP sang HTTPS.
- Thiết lập tệp cron-job tự động gia hạn chứng chỉ 3 tháng một lần mà bạn không cần can thiệp thủ công.

---

## Bước 5: Đảm Bảo Hoạt Động Trơn Tru Bằng Trình Quản Lý PM2 Cluster

Sau khi kết nối tên miền, việc quản lý tiến trình của NodeJS vô cùng thiết yếu để giữ hệ thống online 24/7. Chúng ta sẽ chạy Backend thông qua **PM2** sử dụng cấu hình tối ưu tại `ecosystem.config.cjs`:

- **Chế độ ClusterMode (exec_mode: 'cluster'):** Tận dụng tối đa 100% dung lượng phần cứng CPU của VPS (ví dụ VPS có 2 hay 4 Cores thì PM2 sẽ tự phân bổ chạy 4 tiến trình song song giúp giảm tải nghẽn mạng khi có hàng triệu lượt đấu giá cùng lúc).
- **AutoRestart:** Nếu ứng dụng của bạn gặp lỗi bất ngờ về bộ nhớ hoặc cơ sở dữ liệu và bị crash, PM2 sẽ tự động tái khởi động lại app ngay lập tức chỉ trong mili-giây giúp khách hàng không bị gián đoạn trải nghiệm mua sắm.

Bạn có thể quản lý dịch vụ bằng các lệnh hữu ích sau:
```bash
# Xem danh sách tiến trình đang hoạt động
pm2 status

# Xem log lỗi/bidding trực tiếp theo thời gian thực để debug
pm2 logs amazebid-backend

# Giám sát trực quan lượng RAM/CPU tiêu thụ từ các node
pm2 monit
```

---

## Danh Sách Kiểm Tra Khi Hoàn Tất (Checklist)

Sau khi làm xong các bước trên, hãy đảm bảo hệ thống trơn tru bằng cách kiểm tra:

-  Mở trình duyệt, gõ `https://api.amazebid.co/api/health` trả về kết quả JSON dạng `{"status": "ok"}` và có biểu tượng khóa xanh (SSL hợp lệ).
-  Khi truy cập ứng dụng Frontend `https://amazebid.co`, bảng điều khiển không xuất hiện lỗi đỏ `CORS Error` trong tab Network của DevTools.
-  Tính năng chat trực tiếp và trả giá đấu thầu thời gian thực (realtime bidding) phản hồi ngay lập tức (không hiển thị dòng cảnh báo mất kết nối Socket.io).

Chúc bạn triển khai máy chủ và tên miền thành công rực rỡ!
