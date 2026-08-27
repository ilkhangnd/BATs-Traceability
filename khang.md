## Kết luận phản biện

Đây là **công trình khá mạnh trong nhóm Công nghệ thông tin – Công nghệ phần mềm**, có bài toán thực tế, kiến trúc tương đối hoàn chỉnh, sản phẩm có thể trình diễn và tư duy nghiên cứu tốt hơn mặt bằng nhiều đề tài sinh viên. Tuy nhiên, **bản hiện tại chưa đủ an toàn để cạnh tranh nhóm giải cao** vì ba điểm chính:

1. Tính mới chưa được chứng minh chắc chắn trước hệ thống truy xuất quốc gia và các nghiên cứu 2024–2026.
2. Thực nghiệm còn quá nhỏ, chủ yếu xác nhận chương trình chạy đúng theo luật tự xây dựng.
3. Một số số liệu, bảng biểu, chuẩn kỹ thuật và căn cứ pháp lý chưa nhất quán hoặc chưa cập nhật.

**Điểm dự kiến: 78/100, dao động khoảng ±3 điểm tùy chất lượng mã nguồn, dữ liệu và phần trình diễn thực tế.** Tôi xếp công trình ở mức **có khả năng cạnh tranh vào chung kết, nhưng cần sửa lớn có trọng tâm trước khi nộp**.

## 1. Căn cứ đánh giá

Euréka 2026 chấm vòng bán kết theo thang 100 điểm, gồm:

* Mục đích và ý nghĩa: 15 điểm.
* Nội dung, phương pháp: 30 điểm.
* Tính mới, sáng tạo: 30 điểm.
* Khả năng ứng dụng: 15 điểm.
* Trích dẫn tài liệu: 10 điểm.

Cấu trúc này tương tự năm 2024, nhưng khác năm 2023 khi phần mục đích–ý nghĩa–ứng dụng và hình thức được phân bổ điểm khác. Đáng chú ý, từ năm 2024–2026, **tính mới được tách thành tiêu chí 30 điểm**, nên đây là phần cần đầu tư mạnh nhất. Euréka 2026 cũng ưu tiên các sản phẩm nghiên cứu, phát triển và ứng dụng theo định hướng Nghị quyết 57-NQ/TW; đề tài phù hợp tốt với định hướng này. ([Euréka][1])

## 2. Bảng chấm dự kiến

| Tiêu chí              |  Tối đa | Điểm dự kiến | Nhận định                                                                                                |
| --------------------- | ------: | -----------: | -------------------------------------------------------------------------------------------------------- |
| Mục đích, ý nghĩa     |      15 |       **14** | Bài toán thời sự, có giá trị quản lý và xuất khẩu rõ ràng                                                |
| Nội dung, phương pháp |      30 |       **24** | Đặc tả tương đối chặt, nhưng mới thực nghiệm 6/8 nhóm luật và dữ liệu quá nhỏ                            |
| Tính mới, sáng tạo    |      30 |       **21** | PCIE và kiểm tra xuyên sự kiện có tiềm năng, nhưng chưa so sánh đủ với SOTA và hệ thống quốc gia         |
| Khả năng ứng dụng     |      15 |       **12** | Có website, Zalo Mini App và backend; chưa có thí điểm thực địa hoặc kết nối nguồn dữ liệu có thẩm quyền |
| Trình bày, trích dẫn  |      10 |        **7** | Văn bản khá đẹp nhưng ít tài liệu, thiếu tiêu chuẩn gốc và có lỗi nhất quán bảng–hình                    |
| **Tổng**              | **100** |       **78** | **Sửa lớn trước khi nộp**                                                                                |

## 3. Những điểm mạnh nổi bật

### 3.1. Đặt vấn đề đúng và có chiều sâu

Công trình phân biệt rõ giữa:

* ghi lại lịch sử truy xuất;
* kiểm tra tính nhất quán của lịch sử đó;
* bảo toàn dữ liệu sau khi cam kết.

Tác giả cũng nhận thức đúng giới hạn của blockchain: blockchain không thể tự chứng minh tọa độ, khối lượng hay bằng chứng ngoài thực địa là đúng. Việc nhấn mạnh hệ thống chỉ phát hiện bất thường và hỗ trợ hậu kiểm, không tự động kết luận gian lận, là cách diễn giải thận trọng và khoa học.  

### 3.2. Phần lõi kỹ thuật có cấu trúc hợp lý

Đề tài không chỉ làm website truy xuất QR mà đã hình thành:

* mô hình định danh số vùng trồng;
* các bất biến về không gian, chủ thể, trạng thái, sản lượng;
* kiểm tra xuyên sự kiện bằng Mass Balance và Chain of Custody;
* quyết định giải thích được theo PASS–REVIEW–BLOCK;
* cam kết Merkle và neo bằng chứng sau kiểm tra.

Đây là phần có khả năng tạo giá trị khoa học nếu chứng minh được nó khác và tốt hơn các hệ thống chỉ kiểm tra schema hoặc chỉ lưu lịch sử.   

### 3.3. Có sản phẩm chạy được và tác giả tự nhận diện giới hạn

Website, Zalo Mini App, backend, PostgreSQL/PostGIS, lớp evidence và blockchain đã tạo thành một luồng có thể trình diễn. Phần hạn chế cũng tương đối trung thực khi thừa nhận dữ liệu synthetic, GPS spoofing, thông đồng, thiếu sự kiện, hai nhóm luật chưa hoàn thiện và các tham số cần được hiệu chỉnh bằng dữ liệu thật.  

### 3.4. Bài toán có nhu cầu thực tế rõ ràng

Nguồn Chính phủ ghi nhận tình trạng vay mượn, mua bán mã số vùng trồng; từ năm 2025 đến tháng 5/2026 đã có **403 mã số vùng trồng và 240 mã số cơ sở đóng gói** nhận cảnh báo không tuân thủ từ Trung Quốc. Đây là số liệu rất mạnh nhưng hiện chưa được khai thác trong phần đặt vấn đề. ([media.chinhphu.vn][2])

## 4. Các vấn đề quan trọng phải sửa

| Mức độ             | Vấn đề                                                      | Nhận xét và hướng sửa                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nghiêm trọng**   | **Tính mới chưa được “khóa”**                               | Hệ thống truy xuất nguồn gốc nông sản quốc gia đã công bố sử dụng ký số, blockchain, chuẩn GS1, GS1 Digital Link và trao đổi dữ liệu thống nhất. TrackOne năm 2025 cũng đã kết hợp EPCIS 2.0, blockchain, GPS/khối lượng và phát hiện bất thường; nghiên cứu 2026 đã có kiến trúc edge–cloud–blockchain với anomaly detection. Vì vậy, “kết hợp EPCIS + blockchain + GPS” không thể là điểm mới. Điểm mới phải được giới hạn vào **mô hình bất biến đặc thù mã số vùng trồng, kiểm tra xuyên sự kiện và giải thích quyết định trước khi anchoring**. ([Báo Chính Phủ][3]) |
| **Nghiêm trọng**   | **Thực nghiệm chưa đủ sức thuyết phục**                     | Hiện chỉ có 24 kịch bản, 27 sự kiện, 12 trường hợp đối kháng; mới đánh giá 6/8 nhóm luật. Kết quả F1 = 1 chủ yếu cho thấy chương trình phù hợp với các kịch bản được thiết kế theo chính luật đó, chưa chứng minh khả năng phát hiện ngoài thực tế.  Ngay cả giả sử 12 mẫu dương độc lập, khoảng tin cậy 95% của recall vẫn xấp xỉ **73,5%–100%**. Nên gọi đây là **conformance testing**, không phải đánh giá độ chính xác thực địa.                                                                                                                                     |
| **Nghiêm trọng**   | **Ablation hiện còn mang tính hiển nhiên**                  | Loại một luật rồi chạy lại các kịch bản vốn được tạo để vi phạm chính luật đó đương nhiên làm giảm F1. Thử nghiệm này hữu ích như kiểm tra coverage, nhưng chưa đủ chứng minh đóng góp khoa học.  Cần bổ sung property-based testing, mutation testing và model-based testing cho máy trạng thái CoC.                                                                                                                                                                                                                                                                     |
| **Cao**            | **Chưa đối chiếu chuẩn GS1 đầy đủ**                         | Văn bản mới nói dữ liệu “theo hướng tương thích GS1 EPCIS”, chưa chỉ ra ObjectEvent, AggregationEvent, TransformationEvent, AssociationEvent được ánh xạ thế nào; chưa báo cáo kiểm tra JSON-LD schema và CBV.  Cần trích dẫn trực tiếp EPCIS 2.0, CBV 2.0 và Implementation Guideline chính thức, không chỉ dẫn bài báo về Oliot. ([GS1][4])                                                                                                                                                                                                                             |
| **Cao**            | **Khái niệm Mass Balance/CoC chưa gắn với chuẩn hiện hành** | ISO 22095 và ISO 22095-2:2026 đã quy định khung Chain of Custody và mô hình Mass Balance. Công trình cần nói rõ đây là phép kiểm tra nhất quán nội bộ hay triển khai một mô hình CoC theo ISO; tránh tạo cảm giác hệ thống tự cấp chứng nhận. ([ISO][5])                                                                                                                                                                                                                                                                                                                  |
| **Cao**            | **Công thức Mass Balance có vấn đề đơn vị**                 | Công thức cộng trực tiếp \(\varepsilon_M\) vào khối lượng, trong khi phần thực nghiệm lại diễn giải \(\varepsilon\) theo phần trăm. Cần tách `ε_rel` và `ε_abs`. Đồng thời phải đưa tồn kho đầu kỳ/cuối kỳ, split–merge batch, điều chỉnh cân và sự kiện đến trễ vào mô hình; nếu không, false positive sẽ cao.                                                                                                                                                                                                                                                           |
| **Cao**            | **Nguồn Plantation Registry chưa đủ tin cậy**               | Registry độc lập với event chưa có nghĩa là registry có thẩm quyền. Cần xác định dữ liệu mã số vùng trồng lấy từ đâu, ai ký duyệt, phiên bản nào và đồng bộ lúc nào. Nghị quyết 36/2026/NQ-CP hiện quy định dữ liệu mã số được quản lý tập trung và kết nối với hệ thống truy xuất quốc gia; kiến trúc nên bổ sung một `Authoritative Registry Adapter`. ([media.chinhphu.vn][6])                                                                                                                                                                                         |
| **Cao**            | **Thiếu threat model đầy đủ**                               | Cần lập bảng đối chiếu: GPS spoofing, tài khoản bị chiếm, thông đồng, bỏ qua sự kiện, sửa registry, backdate thời gian, cân gian, replay evidence, thay đổi ruleset. Mỗi mối đe dọa phải ghi rõ: phát hiện được, chỉ giảm thiểu hay ngoài phạm vi. Nên đưa `rulesetHash`, `registryVersion` và `policyVersion` vào semantic envelope được neo.                                                                                                                                                                                                                            |
| **Cao**            | **Số liệu Merkle và bảng biểu chưa nhất quán**              | Kiểm tra trực quan cho thấy các mốc trên Hình 11 không trùng với các giá trị Root median trong bảng ngay sau đó. Bảng Merkle bị chia qua hai trang nhưng phần dưới lại mang chú thích “Hình 12”, trong khi nội dung thực chất là phần tiếp theo của bảng. Ngoài ra, văn bản gọi “Bảng 4.1”, “Bảng 4.3”, “Bảng 4.6” nhưng chú thích lại dùng “Bảng 1”, “Bảng 3”…    Đây là lỗi có thể khiến hội đồng nghi ngờ toàn bộ pipeline tạo kết quả.                                                                                                                                |
| **Trung bình–cao** | **Benchmark chưa có tính tái lập**                          | Phương pháp cam kết công bố phần cứng, phiên bản phần mềm và điều kiện benchmark nhưng phần kết quả không ghi đầy đủ. Microbenchmark 134.924 event/s chỉ đo logic in-memory trên 27 event lặp lại, không phải throughput end-to-end; chưa có HTTP, database, upload, Merkle batching hay anchoring.   Cần báo cáo thêm p50/p95/p99 toàn pipeline, concurrent users, gas cost và cấu hình máy.                                                                                                                                                                             |
| **Trung bình–cao** | **Tên đề tài đang mạnh hơn bằng chứng**                     | Tên hiện tại dùng “phát hiện lạm dụng”, nhưng nội dung nhiều lần khẳng định chỉ phát hiện bất thường và không kết luận gian lận.   Nên đổi thành “phát hiện bất nhất và cảnh báo nguy cơ lạm dụng” hoặc “kiểm tra tính toàn vẹn”.                                                                                                                                                                                                                                                                                                                                         |
| **Trung bình**     | **Chưa phân định phần kế thừa và phần mới**                 | Văn bản nói nghiên cứu phát triển trên codebase BATS đã hoạt động nhưng chưa có bảng xác định thành phần nào có trước, thành phần nào do đề tài Eureka bổ sung.  Đây là câu hỏi hội đồng gần như chắc chắn đặt ra.                                                                                                                                                                                                                                                                                                                                                        |
| **Trung bình**     | **Trích dẫn và hình thức**                                  | Danh mục chỉ có 13 tài liệu, phần lớn đến năm 2023; thiếu Nghị định 38/2026, Nghị quyết 36/2026, tiêu chuẩn GS1, ISO 22095 và chuẩn canonicalization.  Nếu tài liệu [13] là công trình của tác giả hoặc giảng viên hướng dẫn thì có rủi ro làm lộ danh tính, đồng thời mức liên quan với đề tài khá thấp.                                                                                                                                                                                                                                                                 |
| **Trung bình**     | **Một số lỗi tuân thủ mẫu**                                 | Quy định 2026 yêu cầu tóm tắt bắt đầu từ trang thứ nhất, trong khi tóm tắt hiện mang số trang 7.  ([Euréka][1]) Nên để phần đầu dùng số La Mã hoặc không đánh số và bắt đầu trang 1 tại “Tóm tắt công trình”. PDF còn một trang cuối trống, khác khổ A4; cần xóa. Quy định hình thức yêu cầu toàn bộ nội dung A4, Times New Roman 13 và số trang ở giữa phía trên. ([Euréka][1])                                                                                                                                                                                          |

## 5. Gói chỉnh sửa ưu tiên

### Bắt buộc trước khi nộp

| Đầu ra cần bổ sung                 | Yêu cầu kiểm chứng                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bảng so sánh related work**      | So sánh hệ thống quốc gia và khoảng 10–15 công trình gần nhất theo: EPCIS, geofence, authorization, yield, cross-event, Mass Balance, CoC, explainability, anchoring, pilot thực tế |
| **Ba câu hỏi nghiên cứu rõ ràng**  | RQ1: cross-event rules bổ sung gì so với event-level; RQ2: trade-off Recall–FPR của tham số; RQ3: overhead end-to-end của validation-before-anchoring                               |
| **Bảng đóng góp mới**              | Phân biệt rõ “thành phần BATS đã có” và “đóng góp mới của BATS-AgriGuard/Euréka 2026”                                                                                               |
| **Hoàn thiện phạm vi PCIE**        | Triển khai D và T để đủ 8 nhóm; nếu chưa làm được thì sửa toàn bộ mục tiêu, tóm tắt và kết luận thành “6 nhóm đã triển khai, 2 nhóm thiết kế”                                       |
| **Thiết kế lại đánh giá**          | Property-based tests với hàng trăm–hàng nghìn trường hợp; model-based test CoC; mutation score; test dữ liệu đến trễ, thiếu event, split/merge, tồn kho và sai đơn vị               |
| **Conformance GS1**                | Bảng ánh xạ từng nghiệp vụ sang EPCIS event type, CBV, JSON-LD schema và kết quả validation                                                                                         |
| **Đồng nhất số liệu**              | Mọi bảng và hình phải được sinh từ cùng một CSV/script; sửa toàn bộ Hình 11–12, Bảng 1/4.1, Bảng 3/4.3 và danh mục bảng                                                             |
| **Cập nhật pháp lý và tiêu chuẩn** | Thêm Nghị định 38/2026, Nghị quyết 36/2026, tài liệu hệ thống quốc gia, GS1 EPCIS/CBV/Digital Link, ISO 22095 và chuẩn canonicalization                                             |

### Để cạnh tranh giải cao

Cần có ít nhất một **pilot thực tế trên chuỗi sầu riêng**, dù quy mô nhỏ:

* dữ liệu vùng trồng và lô hàng được ẩn danh;
* người gán nhãn hoặc xác nhận kịch bản độc lập với nhóm lập trình;
* báo cáo số event thực tế, số cảnh báo, thời gian xử lý, false positive và khối lượng công việc của Review Queue;
* phản hồi của nông hộ, đơn vị thu gom hoặc cơ sở đóng gói;
* so sánh quy trình trước và sau khi dùng hệ thống.

Trong bối cảnh hệ thống quốc gia đã sử dụng GS1, Digital Link và blockchain, BATS-AgriGuard nên được định vị là **lớp kiểm tra tính nhất quán và tạo evidence trail bổ sung**, không phải một nền tảng truy xuất cạnh tranh hoặc thay thế hệ thống quốc gia. ([Báo Chính Phủ][3])

## 6. Tên đề tài đề xuất

Tên hiện tại quá dài và có phần overclaim. Tên phù hợp hơn:

> **BATS-AgriGuard: Kiểm tra tính toàn vẹn mã số vùng trồng và tính nhất quán nguồn gốc nông sản xuyên sự kiện**

Hoặc thiên về ứng dụng:

> **BATS-AgriGuard: Hệ thống phát hiện bất nhất và cảnh báo nguy cơ lạm dụng mã số vùng trồng trong chuỗi nông sản**

Các công nghệ như GS1 EPCIS, PostGIS, Mass Balance và Merkle nên đưa xuống phụ đề, tóm tắt hoặc phần phương pháp, không cần đưa toàn bộ vào tên.

## 7. Cách viết lại điểm mới

Có thể đặt một đoạn riêng ngay cuối phần khoảng trống nghiên cứu:

> **Điểm mới của công trình không nằm ở việc sử dụng blockchain hoặc GS1 EPCIS riêng lẻ. Công trình đề xuất ba đóng góp chính: (1) mô hình định danh số vùng trồng có phiên bản theo không gian, thời gian, trạng thái và quyền sử dụng; (2) PCIE thực thi các bất biến giải thích được ở cấp sự kiện và xuyên sự kiện để kiểm tra sản lượng, Mass Balance và Chain of Custody; và (3) quy trình validation-before-anchoring tạo cam kết Merkle sau kiểm tra, kèm quyết định PASS–REVIEW–BLOCK và evidence trail phục vụ hậu kiểm.**

Đoạn này chỉ nên giữ sau khi đã có bảng so sánh đủ mạnh với công trình liên quan.

## 8. Các câu hỏi hội đồng nhiều khả năng đặt ra

1. Hệ thống khác gì với Hệ thống truy xuất nguồn gốc nông sản quốc gia?
2. Tính mới nằm ở PCIE hay chỉ là ghép nhiều công nghệ có sẵn?
3. Vì sao cần blockchain, thay vì cơ sở dữ liệu có chữ ký số hoặc transparency log?
4. F1 = 1 trên 12 kịch bản đối kháng có ý nghĩa thống kê gì?
5. Ai bảo đảm Plantation Registry đúng và không bị quản trị viên sửa?
6. Năng suất, tỷ lệ thu hồi và dung sai được lấy từ nguồn nào?
7. Mass Balance xử lý tồn kho, lô trộn, tách lô, đóng gói lại và sự kiện đến trễ ra sao?
8. Phần nào đã có trong BATS trước đề tài và phần nào thực sự do sinh viên nghiên cứu, triển khai?

## Khuyến nghị cuối cùng

**Quyết định phản biện: Major Revision trước khi nộp.**

Không nên bổ sung thêm AI, IoT hay công nghệ mới. Trọng tâm cần đầu tư là:

* chứng minh tính mới;
* hoàn thiện và kiểm chứng đủ PCIE;
* đưa vào dữ liệu thực tế;
* tuân thủ GS1/ISO;
* làm rõ nguồn dữ liệu có thẩm quyền;
* đồng nhất toàn bộ số liệu và bảng hình.

Sau khi hoàn thành các nội dung này, hồ sơ có thể đạt khoảng **87–90/100** và trở thành một đề tài có khả năng cạnh tranh thực sự ở vòng chung kết.

[1]: https://eureka.khoahoctre.com.vn/wp-content/uploads/sites/9/2026/07/The-le-Eureka-2026.pdf "https://eureka.khoahoctre.com.vn/wp-content/uploads/sites/9/2026/07/The-le-Eureka-2026.pdf"
[2]: https://media.chinhphu.vn/kien-quyet-chan-chinh-tinh-trang-mua-ban-ma-so-vung-trong-bao-ve-uy-tin-nong-san-viet-102260515121802463.htm "https://media.chinhphu.vn/kien-quyet-chan-chinh-tinh-trang-mua-ban-ma-so-vung-trong-bao-ve-uy-tin-nong-san-viet-102260515121802463.htm"
[3]: https://baochinhphu.vn/cong-bo-he-thong-truy-xuat-nguon-goc-nong-san-102260630165224491.htm?utm_source=chatgpt.com "Công bố Hệ thống truy xuất nguồn gốc nông sản"
[4]: https://www.gs1.org/standards/epcis "https://www.gs1.org/standards/epcis"
[5]: https://www.iso.org/standard/84427.html "https://www.iso.org/standard/84427.html"
[6]: https://media.chinhphu.vn/don-gian-hoa-tthc-ve-ma-so-vung-trong-ma-so-co-so-dong-goi-102260731191930084.htm "https://media.chinhphu.vn/don-gian-hoa-tthc-ve-ma-so-vung-trong-ma-so-co-so-dong-goi-102260731191930084.htm"
