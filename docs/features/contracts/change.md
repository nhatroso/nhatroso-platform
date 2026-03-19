Bổ sung tính năng cho chức năng hợp đồng hiện tại

Đóng vai trò là một Kỹ sư Phần mềm (Fullstack/Backend). Hãy thiết kế cơ sở dữ liệu và viết mã nguồn (API backend, kèm theo logic xử lý frontend) cho luồng nghiệp vụ tạo hợp đồng thuê phòng/bất động sản.

Luồng xử lý cụ thể như sau:
Khi người quản lý bắt đầu tạo hợp đồng mới và nhập Số điện thoại (SĐT) của người thuê:

1. Truy vấn Hệ thống: Backend kiểm tra SĐT trong bảng `Users`.

2. Xử lý theo 3 kịch bản:
- Kịch bản 1: SĐT chưa tồn tại (Người thuê mới)
  + Frontend: Hiển thị form trống.
  + Backend xử lý submit: Nhận thông tin -> Lưu vào database -> Tự động cấp tài khoản cho người thuê với mật khẩu mặc định là `abc@123` -> Tạo Hợp đồng mới.

- Kịch bản 2: SĐT đã tồn tại + ĐANG có hợp đồng hiệu lực (Đang thuê)
  + Frontend: Bắt API response và hiển thị cảnh báo (Warning): "Khách hàng này hiện đang có hợp đồng thuê trên hệ thống. Vui lòng chắc chắn bạn nhập đúng số điện thoại."
  + Vẫn cho phép quản lý tiếp tục xử lý hợp đồng nếu cần.

- Kịch bản 3: SĐT đã tồn tại + KHÔNG CÓ hợp đồng hiệu lực (Khách cũ quay lại)
  + Frontend: Gọi API lấy dữ liệu User và tự động điền (autofill) vào các trường thông tin trên form hợp đồng.
  + Xử lý submit: Quản lý kiểm tra và có thể cập nhật thông tin mới (nếu có) -> Backend cập nhật profile (nếu cần) -> Tạo Hợp đồng mới liên kết với tài khoản User cũ.
