# BATS — Hướng dẫn Thực hiện & Ghi nhận Số liệu Thử nghiệm Nhanh (Eureka / NCKH Pilot Guide)

Tài liệu này là **Kịch bản Thử nghiệm Nhận thức (Cognitive Walkthrough)** và **Mẫu thu thập chỉ số Usability (SUS & TAM)** dành cho nhóm 3–5 người dùng thực tế (3 Nông dân `FARMER` và 2 Thương lái thu gom `COLLECTOR`). 

Việc hoàn tất 3–5 mẫu khảo sát này giúp BATS nâng mức độ sẵn sàng thực tế của bài báo từ **85–90% lên 95–100%** cho hạng mục NCKH / Giải thưởng Sinh viên Nghiên cứu Khoa học Eureka, bổ sung bằng chứng định lượng vững chắc cho **RQ3 (Khả năng tiếp cận Zalo Mini App offline-first)**.

---

## 1. Chuẩn bị Môi trường & Tài khoản Thử nghiệm

1. **Môi trường:**
   - Đảm bảo Backend và Public Portal đang chạy tại staging hoặc local cố định cùng mạng Wi-Fi (hoặc qua Cloudflare Tunnel / ngrok HTTPS).
   - Zalo Mini App mở trực tiếp trên điện thoại di động (Android / iPhone) qua đường dẫn thử nghiệm hoặc quét mã QR Zalo Mini App.
2. **Người tham gia (`Participants`):**
   - **P1, P2, P3 (`FARMER`):** 3 nông dân hoặc chủ vườn/HTX trồng sầu riêng (hoặc người dùng đóng vai có kinh nghiệm canh tác nông nghiệp thực tế).
   - **P4, P5 (`COLLECTOR`):** 2 thương lái thu gom hoặc nhân viên trạm cân/kho trung chuyển.
3. **Biểu mẫu Đồng thuận (`Consent Form`):**
   - Đọc và cho người tham gia ký xác nhận theo mẫu `CONSENT_FORM_VI.md` (Cam kết ẩn danh dữ liệu cá nhân, chỉ sử dụng cho mục đích nghiên cứu khoa học).

---

## 2. Kịch bản Tác vụ Nghiệp vụ (`Task Protocol`)

Mỗi người dùng thực hiện tuần tự các bước nghiệp vụ theo vai trò được cấp trên Zalo Mini App mà không nhận sự hướng dẫn can thiệp trực tiếp (ngoại trừ giải thích yêu cầu bài toán ban đầu). Quan sát viên dùng đồng hồ bấm giờ để ghi nhận thời gian hoàn thành tác vụ ($T_{\text{task}}$) và đếm số lỗi thao tác lần đầu ($E_{\text{rate}}$).

### Tác vụ 1 ($T_1$ — Dành cho P1, P2, P3 — Role: `FARMER`): Ghi nhận thu hoạch Sầu riêng
1. **Mở Zalo Mini App** $\rightarrow$ Đăng nhập/Chọn vai trò **Nông dân (`FARMER`)**.
2. **Chọn vùng trồng (`Farm Plot`):** Chọn một lô đã đăng ký (ví dụ: Lô A1 - Sầu riêng Ri6, Đạ Huoai).
3. **Ghi nhận GPS & Bằng chứng:** Bấm lấy tọa độ GPS hiện tại (hoặc chấp nhận tọa độ lô trồng), chụp/chọn 1 ảnh minh chứng thu hoạch (`Evidence Photo`).
4. **Nhập thông số lô hàng:** Nhập mã lô/tên giống (Ri6 / Monthong), sản lượng dự kiến (kg), ngày thu hoạch.
5. **Gửi dữ liệu (`Harvest Submission`):** Bấm "Tạo lô thu hoạch". Kiểm tra thông báo lưu thành công vào hàng chờ offline (`Offline Queue`) hoặc đẩy thẳng lên máy chủ.

### Tác vụ 2 ($T_2$ — Dành cho P4, P5 — Role: `COLLECTOR`): Xác nhận chuyển giao & Thu mua
1. **Mở Zalo Mini App** $\rightarrow$ Đăng nhập/Chọn vai trò **Thương lái (`COLLECTOR`)**.
2. **Quét mã QR / Nhập mã lô (`QR Scanning`):** Quét mã QR do nông dân P1/P2/P3 đưa ra hoặc chọn mã lô thu hoạch tương ứng từ danh sách chờ chuyển giao.
3. **Kiểm tra cảnh báo (`Rule Engine Inspection`):** Quan sát các cảnh báo tự động từ hệ thống (nếu có, ví dụ: lệch tọa độ địa lý geofence, sai số trọng lượng vượt ngưỡng 10%, hoặc bằng chứng ảnh bị trùng lặp).
4. **Xác nhận thu mua (`Batch Transfer`):** Nhập trọng lượng thực nhận tại cân (kg), chụp ảnh phiếu cân/xe chuyển hàng, và bấm **"Xác nhận nhận hàng (`Confirm Transfer`)"**.

---

## 3. Bảng Thu thập Chỉ số Hiệu năng Người dùng (`Quantitative Performance Metrics`)

| Mã Người Dùng (`ID`) | Vai trò (`Role`) | Thời gian $T_1$ (Giây) | Lỗi $T_1$ (Lần) | Thời gian $T_2$ (Giây) | Lỗi $T_2$ (Lần) | Hoàn thành thành công? (`Pass/Fail`) | Ghi chú quan sát (`Observational Notes`) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **P1** | Nông dân | `[  ]` | `[  ]` | *N/A* | *N/A* | `[ ] Pass` `[ ] Fail` | |
| **P2** | Nông dân | `[  ]` | `[  ]` | *N/A* | *N/A* | `[ ] Pass` `[ ] Fail` | |
| **P3** | Nông dân | `[  ]` | `[  ]` | *N/A* | *N/A* | `[ ] Pass` `[ ] Fail` | |
| **P4** | Thương lái | *N/A* | *N/A* | `[  ]` | `[  ]` | `[ ] Pass` `[ ] Fail` | |
| **P5** | Thương lái | *N/A* | *N/A* | `[  ]` | `[  ]` | `[ ] Pass` `[ ] Fail` | |
| **Trung vị (`Median`)** | — | **`[  ] s`** | **`[  ]`** | **`[  ] s`** | **`[  ]`** | **`[  ]%`** | *Điền vào Table 4 Bản thảo* |

---

## 4. Bảng Khảo sát Thang điểm Khả dụng (`Vietnamese System Usability Scale — SUS`)

Sau khi hoàn thành tác vụ, người dùng trả lời 10 câu hỏi chuẩn hóa dưới đây theo thang điểm từ **1 (Hoàn toàn không đồng ý)** đến **5 (Hoàn toàn đồng ý)**:

| # | Câu hỏi khảo sát SUS Tiếng Việt | P1 | P2 | P3 | P4 | P5 |
| :-: | :--- | :-: | :-: | :-: | :-: | :-: |
| **Q1 (+)** | Tôi nghĩ rằng tôi sẽ sử dụng ứng dụng Zalo Mini App BATS này thường xuyên trong công việc thu mua/canh tác. | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
| **Q2 (-)** | Tôi thấy ứng dụng này phức tạp một cách không cần thiết. | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
| **Q3 (+)** | Tôi thấy ứng dụng này dễ sử dụng và thao tác trên điện thoại. | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
| **Q4 (-)** | Tôi nghĩ tôi sẽ cần sự hỗ trợ của người am hiểu kỹ thuật để có thể sử dụng ứng dụng này. | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
| **Q5 (+)** | Tôi thấy các tính năng trong ứng dụng này được tích hợp rất hợp lý và mạch lạc. | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
| **Q6 (-)** | Tôi thấy có quá nhiều sự bất nhất (lệch lạc, khó hiểu) trong ứng dụng này. | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
| **Q7 (+)** | Tôi nghĩ hầu hết mọi người (kể cả nông dân ít dùng công nghệ) sẽ học cách sử dụng ứng dụng này rất nhanh chóng. | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
| **Q8 (-)** | Tôi thấy rất cồng kềnh và phiền phức khi thao tác ghi nhận thông tin lô thu hoạch/thu mua trên ứng dụng. | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
| **Q9 (+)** | Tôi cảm thấy rất tự tin khi sử dụng ứng dụng này (không sợ nhập sai gây mất dữ liệu). | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
| **Q10 (-)** | Tôi phải học và ghi nhớ rất nhiều điều trước khi có thể bắt đầu sử dụng ứng dụng này. | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
| | **Điểm SUS Tổng ($0 \rightarrow 100$)** *(Công thức tính bên dưới)* | **`[  ]`** | **`[  ]`** | **`[  ]`** | **`[  ]`** | **`[  ]`** |

### Công thức tính điểm SUS cho mỗi người dùng ($S_i$):
- Với câu hỏi số **Lẻ (`+`: Q1, Q3, Q5, Q7, Q9)**: Điểm đóng góp = $\text{Điểm đánh giá} - 1$
- Với câu hỏi số **Chẵn (`-`: Q2, Q4, Q6, Q8, Q10)**: Điểm đóng góp = $5 - \text{Điểm đánh giá}$
- **Điểm SUS ($S_i$) = Tổng điểm đóng góp của 10 câu hỏi $\times\ 2.5$**
- *Thang đo đánh giá chuẩn:* $S_i \ge 68.0$ (Đạt chuẩn khả dụng / `Acceptable Usability`); $S_i \ge 80.0$ (Xuất sắc / `Excellent`).

---

## 5. Bảng Khảo sát Mô hình Chấp nhận Công nghệ (`Technology Acceptance Model — TAM`)

Đánh giá nhanh theo thang từ **1 (Rất không đồng ý)** đến **5 (Rất đồng ý)**:

| Chỉ số TAM | Câu hỏi khảo sát | P1 | P2 | P3 | P4 | P5 | Trung bình (`Mean`) |
| :--- | :--- | :-: | :-: | :-: | :-: | :-: | :---: |
| **PU1** (`Perceived Usefulness`) | Ứng dụng BATS giúp tôi chứng minh nguồn gốc lô hàng minh bạch, nâng cao uy tín với khách hàng/đối tác. | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | **`[  ]`** / 5.0 |
| **PU2** (`Perceived Usefulness`) | Việc lưu trữ hàng chờ offline giúp công việc ghi chép của tôi không bị gián đoạn ngay cả khi ra vườn không có sóng 4G/Wi-Fi. | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | **`[  ]`** / 5.0 |
| **PEU1** (`Perceived Ease of Use`) | Giao diện Zalo Mini App quen thuộc, không yêu cầu cài thêm ứng dụng mới hay tạo ví tiền mã hóa phức tạp. | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | **`[  ]`** / 5.0 |
| **PEU2** (`Perceived Ease of Use`) | Các bước thao tác chụp ảnh và bấm chọn mã lô thu hoạch/thu mua rất nhanh gọn, tốn ít thời gian. | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | **`[  ]`** / 5.0 |

---

## 6. Hướng dẫn Đưa Số liệu vào Bản thảo Bài báo (`Manuscript Integration`)

Sau khi thu thập xong số liệu từ 5 người tham gia:
1. Mở tệp `MANUSCRIPT_DRAFT.md`.
2. Tìm **Section 5.6: Small-Scale Usability Pilot & Cognitive Walkthrough**.
3. Cập nhật các con số thực tế vào bảng tổng hợp:
   - Điểm **SUS trung bình (`Mean SUS Score`)** và độ lệch chuẩn ($\sigma$).
   - Thời gian hoàn thành tác vụ trung vị **$T_{\text{task}}$ (Giây)** cho $T_1$ và $T_2$.
   - Tỷ lệ lỗi lần đầu **$E_{\text{rate}}$ (%)**.
4. Khẳng định thận trọng và khách quan trong phần **Section 6 (Discussion & Conclusion)**: *BATS đạt điểm SUS trung bình $[X]/100$, cung cấp bằng chứng ban đầu về khả năng giảm rào cản kỹ thuật Web3 và nâng cao tính khả thi khi áp dụng thực địa cho nông hộ quy mô nhỏ thông qua nền tảng Zalo Mini App offline-first.*
