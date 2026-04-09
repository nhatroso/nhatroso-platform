# BRD – NHATROSO Platform (VI)

Owner: Bao Dinh
Status: Review
Type: BRD
Version: v1.0

**BUSINESS REQUIREMENTS DOCUMENT (BRD)**

**Dự án: NHATROSO PLATFORM - Hệ thống Quản lý Nhà trọ với tính năng tự động ghi nhận chỉ số điện nước từ ảnh chụp đồng hồ**

### 1. Project Overview

#### 1.1 Mục tiêu dự án

Xây dựng hệ thống phần mềm giúp **tự động hoá quản lý nhà trọ**, bao gồm:

- Quản lý phòng, hợp đồng, cư dân tập trung
- Ghi nhận chỉ số điện nước với bằng chứng ảnh chụp (tiền đề cho tự động nhận diện OCR)
- Tự động tạo hoá đơn và hỗ trợ thanh toán online qua QR/Webhook
- Cung cấp báo cáo doanh thu và tình trạng phòng

Mục tiêu cuối cùng là **giảm thao tác thủ công, tăng minh bạch và tối ưu vận hành** cho chủ nhà.

#### 1.2 Vấn đề hiện tại

Quy trình quản lý thủ công gây ra:

- Sai sót khi ghi chỉ số điện nước
- Tranh chấp do thiếu bằng chứng hình ảnh
- Dữ liệu phân tán ở nhiều công cụ
- Thanh toán chậm làm ảnh hưởng dòng tiền

Những hạn chế này làm giảm hiệu quả quản lý nhà trọ.

#### 1.3 Phạm vi dự án

**In-scope**

- Quản lý phòng, cư dân, hợp đồng
- Quy trình ghi điện nước minh bạch với bằng chứng ảnh chụp (hỗ trợ trích xuất số thủ công/tự động)
- Tạo hoá đơn và thanh toán QR (hỗ trợ đối soát Webhook)
- Dashboard báo cáo doanh thu và tình trạng phòng/dịch vụ

**Out-of-scope**

- Tích hợp IoT đọc số tự động
- Hỗ trợ toàn bộ loại đồng hồ điện tử
- Triển khai thương mại quy mô lớn

Các giới hạn này đã được nêu rõ trong đề cương.

### 2. Stakeholders

| Vai trò       | Trách nhiệm                                       |
| ------------- | ------------------------------------------------- |
| Sponsor       | Phê duyệt đề tài và đánh giá kết quả              |
| Product Owner | Định hướng sản phẩm và mục tiêu                   |
| BA/Dev/Test   | Sinh viên chịu trách nhiệm toàn bộ vòng đời dự án |
| Advisor       | Cố vấn học thuật và chuyên môn                    |

Cơ cấu nhân sự gồm sinh viên thực hiện và giảng viên hướng dẫn.

### 3. Business Objectives (SMART)

- Tự động hoá việc ghi điện nước để **giảm thời gian xử lý hàng tháng**
- Tăng tính minh bạch, **giảm tranh chấp giữa chủ nhà và người thuê**
- Tối ưu dòng tiền bằng **thanh toán online và cập nhật trạng thái tự động**
- Nâng cao hiệu quả quản lý thông qua **báo cáo doanh thu thời gian thực**

Các mục tiêu này xuất phát từ nhu cầu chuyển đổi số trong quản lý nhà trọ.

### 4. Current Process (AS-IS)

Quy trình hiện tại:

1. Chủ nhà đi từng phòng ghi điện nước thủ công
2. Tính tiền bằng tay hoặc Excel
3. Gửi thông báo thanh toán thủ công
4. Chờ đối soát chuyển khoản

Pain points:

- Tốn thời gian, dễ sai sót
- Thiếu minh bạch
- Khó tổng hợp dữ liệu

Thực trạng này là động lực chính của dự án.

### 5. Future Process (TO-BE)

Sau khi triển khai hệ thống:

1. Chụp ảnh đồng hồ → hệ thống tự động trích xuất số
2. Hệ thống tính tiền và tạo hoá đơn
3. Gửi thông báo + QR thanh toán
4. Tự động xác nhận khi nhận tiền
5. Hiển thị báo cáo doanh thu realtime

Quy trình mới giúp **tự động hoá toàn bộ vòng đời hoá đơn**.

### 6. Business Requirements

| ID    | Mô tả                                                | Priority |
| ----- | ---------------------------------------------------- | -------- |
| BR-01 | Quản lý danh sách phòng và trạng thái                | High     |
| BR-02 | Quản lý cư dân và hợp đồng thuê                      | High     |
| BR-03 | Chụp ảnh đồng hồ và tự động trích xuất chỉ số từ ảnh | High     |
| BR-04 | Tự động tính tiền điện nước                          | High     |
| BR-05 | Tạo và gửi hoá đơn điện tử                           | High     |
| BR-06 | Thanh toán bằng QR chuyển khoản                      | High     |
| BR-07 | Theo dõi trạng thái thanh toán                       | High     |
| BR-08 | Dashboard báo cáo doanh thu                          | Medium   |
| BR-09 | Tenant xem hoá đơn và lịch sử giao dịch              | High     |
| BR-10 | Gửi yêu cầu sự cố từ tenant                          | Medium   |

Các chức năng này phản ánh đầy đủ hai nhóm người dùng Chủ trọ và Người thuê.

### 7. Non-Functional Requirements

- Hệ thống có khả năng mở rộng
- Xử lý nhanh, tiết kiệm chi phí
- Phân quyền xác thực bảo mật giữa Chủ trọ và Người thuê
- Hỗ trợ truy cập web, app và mobile responsive

Các yêu cầu này đảm bảo tính ổn định và an toàn dữ liệu.

### 8. Assumptions & Constraints

**Assumptions**

- Người dùng có smartphone và internet
- Đồng hồ điện nước dạng cơ phổ biến

**Constraints**

- Thời gian thực hiện 4 tháng
- Tính năng trích xuất chỉ số phụ thuộc chất lượng ảnh
- Chưa tích hợp tự động bằng các thiết bị đồng hộ điện nước thông minh

Các rủi ro và giới hạn đã được xác định rõ.

### 9. Success Metrics / Acceptance Criteria

Dự án được coi là thành công khi:

- Tính năng trích xuất chỉ số đủ chính xác để sử dụng thực tế
- Hệ thống tạo hoá đơn và thanh toán hoạt động trơn tru
- Chủ nhà quản lý phòng và doanh thu trên một nền tảng duy nhất
- Hoàn thành đúng tiến độ đồ án
