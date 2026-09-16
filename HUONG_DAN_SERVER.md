# Hướng dẫn triển khai static

Website không cần Node.js khi chạy production. Build trên máy phát triển rồi phục vụ nội dung `dist/` bằng HTTPS.

## Build và kiểm tra

```bash
npm install
npm run verify
```

Sao chép toàn bộ nội dung `dist/` lên thư mục web root. Có thể kiểm tra cục bộ bằng:

```bash
npm run preview -- --host 0.0.0.0
```

Lệnh preview chỉ phù hợp kiểm tra/nội bộ, không phải server production.

## Ví dụ Nginx

```nginx
server {
    listen 80;
    server_name example.local;
    root /var/www/tcs23/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Sau khi tải bản mới lên, kiểm tra cấu hình và reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Nên cấu hình HTTPS, header bảo mật và cache asset theo chính sách hạ tầng. Không cache dài `index.html` để tránh giữ phiên bản cũ.

## Giới hạn vận hành

Đây là frontend static: dữ liệu, phiên đăng nhập và backup đều nằm trong `localStorage` của từng trình duyệt. Server không nhận file Excel, không lưu database và không đồng bộ giữa người dùng. Việc đặt site sau Nginx/HTTPS không bổ sung xác thực hay phân quyền backend; bản này không phải hệ thống multi-user an toàn. Muốn dùng dữ liệu thật giữa nhiều người cần xây backend, xác thực server, database, audit và backup tập trung.
