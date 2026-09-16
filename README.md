# Website quản lý công việc TCS23

Ứng dụng React/Vite chạy hoàn toàn trong trình duyệt, dùng `localStorage`; không có backend và không đồng bộ dữ liệu giữa máy hoặc người dùng.

Dataset đóng gói lấy số liệu nghiệp vụ thực từ workbook nguồn cho tổ HKD1. Bảy tổ còn lại có roster nhân sự từ demo được duyệt, chưa có chỉ tiêu nghiệp vụ; khi nhập file theo tổ, ứng dụng chỉ cập nhật partition tổ đó và giữ nguyên dữ liệu các tổ khác.

## Cài đặt và kiểm tra

Yêu cầu Node.js phiên bản LTS hiện hành và trình duyệt Chrome, Edge hoặc Firefox còn được hỗ trợ.

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
npm run verify
```

`npm run dev` mở máy chủ phát triển (thường tại `http://localhost:5173`). `npm run verify` build mới bản phát hành vào `dist/`, rồi đối chiếu nội dung của mã nguồn và chính các asset vừa build.

## Đăng nhập và phân quyền

- Tài khoản `Lãnh đạo 01` đến `Lãnh đạo 04` xem dữ liệu của đủ 8 tổ, được nhập Excel và khôi phục backup.
- Tài khoản tổ trưởng chỉ xem dữ liệu của tổ mình. Ví dụ HKD1 không thấy QLDN2 và không có màn hình nhập dữ liệu.
- Đây chỉ là lựa chọn vai trò phía client, không có mật khẩu/xác thực máy chủ. Không dùng cơ chế này để bảo vệ dữ liệu nhạy cảm hoặc triển khai nhiều người dùng không tin cậy.

Ứng dụng có 7 màn hình: Tổng quan, Công việc cá nhân, Nhân sự & địa bàn, Báo cáo, Cảnh báo, Danh mục nhiệm vụ và Nhập dữ liệu Excel (chỉ lãnh đạo).

## Nhập Excel

Hỗ trợ `.xlsx`/`.xls`, tối đa 20 MB. Workbook chuẩn gồm bốn sheet:

- `Teams`: Mã tổ, Tên tổ, Tên ngắn.
- `Officers`: Mã cán bộ, Tên cán bộ, Chức danh, Mã tổ, Địa bàn.
- `TaskDefinitions`: Mã nhiệm vụ, Tên nhiệm vụ, Nhóm, Đơn vị, Cách đo, Kỳ báo cáo, Mã tổ áp dụng.
- `WorkItems`: Mã công việc, Mã nhiệm vụ, Mã tổ, Mã cán bộ, Phải thực hiện, Đã thực hiện, Thời hạn, Trạng thái.

Các ID và quan hệ tham chiếu là bắt buộc; số phải không âm, số đã làm không vượt số phải làm, ngày dùng định dạng hợp lệ và trạng thái thuộc tập ứng dụng hỗ trợ. Sau khi chọn file, luôn xem phần xem trước, số dòng hợp lệ/trùng và bảng lỗi. Có thể tải danh sách lỗi; nút thay thế chỉ bật khi toàn bộ workbook hợp lệ.

Khi xác nhận nhập, dữ liệu hiện tại được lưu làm backup rồi dataset mới được ghi. “Khôi phục bản sao lưu” đổi dataset hiện tại về backup gần nhất. Mỗi lần thay thế tiếp theo sẽ cập nhật backup.

## Lưu trữ, riêng tư và giới hạn

- Dataset dùng schema `schemaVersion: 1`, lưu tại `localStorage` dưới khóa `tcs23:dataset:v1`; phiên đăng nhập và backup có khóa riêng.
- Dữ liệu chỉ nằm trong profile trình duyệt đang dùng. Xóa dữ liệu website/chế độ riêng tư có thể làm mất dữ liệu; nên giữ file Excel nguồn bên ngoài.
- File được phân tích cục bộ. Worker/parser có thể giữ bản sao tạm trong bộ nhớ đến khi hoàn tất/thu gom rác; giới hạn 20 MB giảm rủi ro nhưng không thay thế kiểm soát dữ liệu nhạy cảm.
- `localStorage` không mã hóa, không audit, không khóa ghi đồng thời và không chống sửa dữ liệu bằng DevTools. Static hosting không biến ứng dụng thành hệ thống multi-user an toàn.

Lộ trình backend: xác thực tập trung, phân quyền phía server, cơ sở dữ liệu có migration, API import theo giao dịch, lịch sử/audit, backup định kỳ, mã hóa, đồng bộ và xử lý xung đột.

Xem [HUONG_DAN_SERVER.md](HUONG_DAN_SERVER.md) để triển khai bản static.
