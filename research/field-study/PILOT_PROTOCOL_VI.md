# BATS — Đề cương pilot thực địa và HCI

Trạng thái: **sẵn sàng để hội đồng/người hướng dẫn rà soát; chưa tuyển người tham gia**.

## 1. Mục tiêu

Đánh giá khả năng hoàn thành tác vụ truy xuất nguồn gốc bằng BATS trong điều
kiện thiết bị và kết nối thực tế. Pilot trả lời RQ3 bằng dữ liệu task completion,
thời gian thao tác, lỗi đồng bộ, nhu cầu hỗ trợ và SUS. Pilot không dùng để
chứng minh độ chính xác phát hiện gian lận nếu chưa có quy trình gán nhãn độc lập.

## 2. Thiết kế

- Loại nghiên cứu: exploratory mixed-method, within-participant.
- Quy mô dự kiến: 10–30 người thuộc nông hộ/HTX; số cuối cùng phải báo cáo đúng.
- Địa điểm dự kiến: Đắk Lắk, cần ghi xã/huyện và điều kiện mạng thực tế.
- Thiết bị: Android/iOS cá nhân hoặc thiết bị nghiên cứu; ghi model, OS và Zalo version.
- Điều kiện: online ổn định, mạng yếu và mất mạng rồi khôi phục.
- Phiên bản hệ thống phải được đóng băng bằng Git commit/tag trước phiên đầu tiên.

## 3. Tiêu chí tham gia

- Từ 18 tuổi và tự nguyện đồng ý.
- Có vai trò phù hợp trong quy trình nông hộ/HTX.
- Có thể sử dụng điện thoại thông minh ở mức cơ bản.
- Loại trừ người tham gia thử nghiệm thiết kế trước đó khỏi phân tích chính,
  hoặc báo cáo riêng để tránh learning bias.

## 4. Tác vụ

1. Mở Mini App và xác nhận đúng tài khoản/HTX.
2. Chọn vùng trồng được giao.
3. Tạo một lô thu hoạch gồm giống, khối lượng, GPS và ảnh bằng chứng.
4. Thực hiện tác vụ trong điều kiện mất mạng; kiểm tra queue local.
5. Khôi phục mạng và xác nhận hệ thống chỉ tạo đúng một lô.
6. Với vai trò phù hợp, ghi nhận bước chuyển giao/thu gom.
7. Quét Digital Link của lô và tìm trạng thái xác minh.

Không hướng dẫn thao tác trong lúc đo, trừ khi người tham gia yêu cầu trợ giúp.
Mỗi lần trợ giúp phải được ghi lại.

## 5. Chỉ số

- Task completion rate (%).
- Completion time tính từ lúc bắt đầu task đến phản hồi thành công.
- Số lỗi validation, lỗi sync và duplicate.
- Số lần cần trợ giúp và loại trợ giúp.
- Offline queue success rate và exactly-once sync rate.
- SUS tổng điểm 0–100.
- Ghi chú định tính: điểm khó hiểu, thuật ngữ, thao tác bị bỏ dở.

Mục tiêu `<60 giây` và `SUS >70` là hypothesis/target đã đăng ký trước, không phải
kết quả hiện tại.

## 6. Quy trình phiên thử nghiệm

1. Giải thích nghiên cứu và lấy đồng thuận.
2. Gán participant ID ngẫu nhiên; không dùng họ tên trong dataset phân tích.
3. Ghi metadata thiết bị/mạng tối thiểu.
4. Đọc kịch bản tác vụ thống nhất.
5. Ghi timestamp và sự kiện quan sát.
6. Hoàn thành SUS ngay sau tác vụ.
7. Phỏng vấn ngắn 5–10 phút.
8. Kiểm tra dữ liệu, tách bảng liên kết danh tính khỏi dataset phân tích.

## 7. Phân tích dự kiến

- Báo cáo median, IQR, p95 và khoảng tin cậy phù hợp cho thời gian.
- Báo cáo numerator/denominator cho mọi tỷ lệ.
- So sánh online/offline chỉ khi cùng protocol và đủ mẫu; không suy diễn causal
  nếu không randomize thứ tự.
- Báo cáo mọi phiên bị loại và lý do.
- Không điều chỉnh rule/threshold sau khi xem nhãn pilot mà không ghi version.

## 8. Điều kiện chưa được phép bắt đầu tuyển người

- Có phê duyệt đạo đức/người hướng dẫn theo quy định đơn vị.
- Hoàn thiện thông tin liên hệ và chính sách lưu/xóa dữ liệu trong consent form.
- Zalo Mini App chạy trên thiết bị thật và có recovery procedure.
- Freeze commit, tạo data dictionary, kiểm tra không thu thập dữ liệu thừa.
- Có người chịu trách nhiệm xử lý sự cố và yêu cầu rút dữ liệu.
