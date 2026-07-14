import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="homeMain">
      {/* Hero Section */}
      <section className="hero">
        <div className="heroContent">
          <div className="heroBadge">
            <span className="liveIndicator" /> Hệ thống chính thức · Đa dạng Nông sản & Trái cây Việt Nam
          </div>
          <div className="eyebrow">TRUY XUẤT NGUỒN GỐC · KIỂM CHỨNG THỰC TẾ · MINH BẠCH DỮ LIỆU</div>
          <h1>
            Mỗi nông sản sạch,<br />một hành trình minh bạch.
          </h1>
          <p>
            Ghi nhận nhật ký canh tác và thu hoạch tự động cho <strong>Sầu riêng, Xoài Cát, Cà phê, Thanh long, Bưởi Da Xanh...</strong> Cảnh báo sai lệch ngay tại vườn dưới 60 giây và lưu trữ bằng chứng an toàn tuyệt đối — đơn giản, dễ dùng cho mọi nông hộ.
          </p>
          <div className="heroActions">
            <Link className="button primary" href="/dashboard/batches">
              🌿 Mở bảng điều hành chuỗi
            </Link>
            <Link className="button secondary" href="/verify/8930000000019/SR-20260704-000001/0001">
              🔍 Xem lô mẫu Sầu Riêng
            </Link>
            <Link className="textLink" href="/architecture">
              Khám phá kiến trúc BATS →
            </Link>
          </div>
          <div className="stats">
            <div>
              <strong>8+</strong>
              <span>Loại cây trồng đặc sản</span>
            </div>
            <div>
              <strong>7</strong>
              <span>Quy tắc kiểm tra thực địa</span>
            </div>
            <div>
              <strong>Chuẩn Quốc Tế</strong>
              <span>Mã QR Truy Xuất Nguồn Gốc</span>
            </div>
            <div>
              <strong>Bảo Mật Cao</strong>
              <span>Lưu trữ Blockchain Bất biến</span>
            </div>
          </div>
        </div>

        <div className="heroVisual">
          <div className="heroImageCard">
            <Image
              src="/images/farm-hero.png"
              alt="Vùng trồng trái cây đặc sản Việt Nam dưới ánh nắng sớm"
              width={640}
              height={420}
              className="featuredImage"
              priority
            />
            <div className="heroImageCaption">
              <span className="captionBadge">🌿 Thực địa chuẩn hóa</span>
              <p>Số hóa vườn cây, quản lý tọa độ polygon và định danh từng vụ mùa chất lượng cao.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Crop Showcase Section (Đa dạng nông sản & trái cây) */}
      <section className="cropsShowcase">
        <div className="sectionIntro center">
          <div className="eyebrow">KHÔNG CHỈ SẦU RIÊNG · ĐA DẠNG HỆ SINH THÁI</div>
          <h2>Nền tảng chuẩn hóa cho mọi nông sản đặc sản Việt Nam</h2>
          <p>
            Hệ thống BATS linh hoạt thích ứng với các quy trình canh tác, thu hoạch và chế biến khác nhau, từ trái cây tươi xuất khẩu đến nông sản công nghiệp.
          </p>
        </div>

        <div className="cropGrid">
          <article className="cropCard durian">
            <div className="cropIcon">🍈</div>
            <div className="cropMeta">Đắk Lắk · Krông Pắc</div>
            <h3>Sầu riêng Ri6 & Dona</h3>
            <p>Kiểm soát vùng trồng chuẩn mã số xuất khẩu, theo dõi hàm lượng chất khô và thời gian cách ly phân thuốc.</p>
            <Link className="cropLink" href="/verify/8930000000019/SR-20260704-000001/0001">
              Tra cứu lô mẫu SR-000001 →
            </Link>
          </article>

          <article className="cropCard mango">
            <div className="cropIcon">🥭</div>
            <div className="cropMeta">Tiền Giang · Cái Bè</div>
            <h3>Xoài Cát Hòa Lộc</h3>
            <p>Ghi nhận quy trình bao trái, độ Brix thu hoạch và quy trình xử lý nhiệt hơi nước trước khi đóng gói.</p>
            <Link className="cropLink" href="/verify/8930000000026/XC-20260705-000002/0001">
              Tra cứu lô mẫu XC-000002 →
            </Link>
          </article>

          <article className="cropCard coffee">
            <div className="cropIcon">☕</div>
            <div className="cropMeta">Đắk Lắk · Cư M&apos;gar</div>
            <h3>Cà phê Robusta Sẻ</h3>
            <p>Đảm bảo tỷ lệ quả chín trên 95%, kiểm soát nhiệt độ lên men và độ ẩm phơi giàn nhà kính.</p>
            <Link className="cropLink" href="/verify/8930000000033/CP-20260706-000003/0001">
              Tra cứu lô mẫu CP-000003 →
            </Link>
          </article>

          <article className="cropCard dragon">
            <div className="cropIcon">🐲</div>
            <div className="cropMeta">Bình Thuận · Hàm Thuận Nam</div>
            <h3>Thanh long Ruột Đỏ LĐ1</h3>
            <p>Quản lý nhật ký chông đèn xông trái, kiểm định dư lượng bảo vệ thực vật theo tiêu chuẩn GlobalGAP.</p>
            <Link className="cropLink" href="/verify/8930000000040/TL-20260707-000004/0001">
              Tra cứu lô mẫu TL-000004 →
            </Link>
          </article>

          <article className="cropCard pomelo">
            <div className="cropIcon">🍊</div>
            <div className="cropMeta">Bến Tre · Châu Thành</div>
            <h3>Bưởi Da Xanh Phúc Lộc</h3>
            <p>Truy xuất nguồn gốc cây giống gốc ghép, kiểm tra quy trình rửa trái, bọc màng co và giữ tươi tự nhiên.</p>
            <Link className="cropLink" href="/verify/8930000000057/BD-20260708-000005/0001">
              Tra cứu lô mẫu BD-000005 →
            </Link>
          </article>

          <article className="cropCard longan">
            <div className="cropIcon">🍒</div>
            <div className="cropMeta">Hưng Yên · Khoái Châu</div>
            <h3>Nhãn Lồng Hương Chi</h3>
            <p>Kiểm định quy trình tỉa chùm, theo dõi độ ngọt Brix tự nhiên và tiêu chuẩn đóng thùng giữ tươi lạnh xuất khẩu.</p>
            <Link className="cropLink" href="/verify/8930000000064/HY-20260708-000006/0001">
              Tra cứu lô mẫu HY-000006 →
            </Link>
          </article>

          <article className="cropCard avocado">
            <div className="cropIcon">🥑</div>
            <div className="cropMeta">Lâm Đồng · Bảo Lộc</div>
            <h3>Bơ Sáp 034 Đặc Sản</h3>
            <p>Quy trình thu hoạch đúng độ tuổi chín già, không chất bảo quản, kiểm tra tỷ lệ dầu và độ dẻo vàng hạt nhỏ chuẩn VietGAP.</p>
            <Link className="cropLink" href="/verify/8930000000071/LD-20260709-000007/0001">
              Tra cứu lô mẫu LD-000007 →
            </Link>
          </article>

          <article className="cropCard mangosteen">
            <div className="cropIcon">🟣</div>
            <div className="cropMeta">Bình Dương · Lái Thiêu</div>
            <h3>Măng Cụt Lái Thiêu</h3>
            <p>Đặc sản vườn cây lâu năm, ghi nhận thời điểm hái trái điểm hồng và quy trình đóng thùng xốp chống dập nát khi vận chuyển.</p>
            <Link className="cropLink" href="/verify/8930000000088/MC-20260709-000008/0001">
              Tra cứu lô mẫu MC-000008 →
            </Link>
          </article>
        </div>
      </section>

      {/* Visual Principles Section */}
      <section className="principlesVisual">
        <div className="principlesText">
          <div className="eyebrow">THÂN THIỆN NÔNG HỘ · NGHIỆP VỤ CHẶT CHẼ</div>
          <h2>Công nghệ phục vụ người nông dân</h2>
          <p>
            Thay vì bắt nông dân gõ phím hay hiểu khái niệm blockchain trừu tượng, Zalo Mini App và web dashboard tối giản thao tác bằng nút bấm lớn, chụp ảnh tự động đính tọa độ GPS và quét mã nhanh chóng.
          </p>

          <div className="principlesList">
            <article>
              <span>01</span>
              <div>
                <h3>Thu thập tại vườn dưới 60 giây</h3>
                <p>Nông dân chỉ cần bấm chọn lô, nhập sản lượng và chụp ảnh đống trái vừa hái. Tọa độ GPS và thời gian thực được khóa tự động.</p>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <h3>Kiểm soát rủi ro thực địa tức thì</h3>
                <p>Hệ thống tự động báo động nếu vị trí thu hoạch lệch khỏi vùng trồng, năng suất vượt quá diện tích, hoặc ảnh bị dùng lại nhiều lần.</p>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <h3>Kiểm chứng Blockchain độc lập</h3>
                <p>Mỗi sự kiện thu hoạch được đóng gói bằng mã bảo mật và lưu trên sổ cái Blockchain, giúp nhà nhập khẩu kiểm chứng độ trung thực của lô hàng mà không bị lộ bí mật kinh doanh.</p>
              </div>
            </article>
          </div>
        </div>

        <div className="principlesImageGrid">
          <div className="imageWrapper">
            <Image
              src="/images/harvest-showcase.png"
              alt="Giỏ trái cây đặc sản thu hoạch thực tế"
              width={480}
              height={340}
              className="roundedImage"
            />
            <span className="imageTag">🍎 Giỏ nông sản đa dạng thu hoạch tại vườn</span>
          </div>
          <div className="imageWrapper">
            <Image
              src="/images/farmer-check.png"
              alt="Nông dân kiểm tra mã QR truy xuất GS1"
              width={480}
              height={340}
              className="roundedImage"
            />
            <span className="imageTag">📱 Thao tác quét QR dễ dàng cho nhà vườn</span>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="homeArchitecture">
        <div className="sectionIntro">
          <div>
            <div className="eyebrow">KIẾN TRÚC HỆ THỐNG BATS</div>
            <h2>Dữ liệu nghiệp vụ ở trung tâm.<br />Bảo mật Blockchain ở đúng vị trí.</h2>
          </div>
          <p>
            Hệ thống BATS tối ưu hóa lưu trữ và chi phí: Cơ sở dữ liệu chuyên dụng quản lý thông tin canh tác và bản đồ vùng trồng (GPS), bộ kiểm định tự động chặn rủi ro gian lận ngay tại vườn, còn công nghệ Blockchain chỉ dùng để đóng gói và khóa bảo mật mã xác thực, vừa nhanh chóng vừa chống làm giả.
          </p>
        </div>
        <div className="miniFlow" aria-label="Luồng kiến trúc BATS">
          <article>
            <span>01 · GIAO DIỆN</span>
            <strong>Zalo · Web · QR</strong>
            <small>Ghi nhận dễ dàng ngay tại vườn</small>
          </article>
          <b>→</b>
          <article>
            <span>02 · XỬ LÝ</span>
            <strong>Kiểm định · Bản đồ GPS</strong>
            <small>Chuẩn hóa & kiểm tra tự động</small>
          </article>
          <b>→</b>
          <article>
            <span>03 · BẢO MẬT</span>
            <strong>Khóa Minh Bạch · Blockchain</strong>
            <small>Lưu trữ an toàn, chống làm giả</small>
          </article>
        </div>
        <div className="architectureCta">
          <div>
            <span className="pulseDot" /> 9 thành phần kiến trúc đã hoàn thiện mã nguồn
          </div>
          <Link className="button primary" href="/architecture">Xem sơ đồ & tài liệu chi tiết →</Link>
        </div>
      </section>

      {/* Outcomes Section */}
      <section className="outcomes">
        <div className="sectionIntro light">
          <div>
            <div className="eyebrow">MỘT LUỒNG DỮ LIỆU, NHIỀU VAI TRÒ</div>
            <h2>Từ nông trại đến bàn ăn thị trường quốc tế.</h2>
          </div>
          <p>Mỗi bên tham gia chỉ thấy giao diện thân thiện với công việc của mình, nhưng cùng tạo nên một chuỗi giá trị minh bạch không thể làm giả.</p>
        </div>
        <div className="roleGrid">
          <article>
            <span>👨‍🌾 Nhà Vườn / Hợp Tác Xã</span>
            <h3>Ghi nhận thu hoạch & chăm sóc</h3>
            <p>Zalo Mini App hoạt động mượt mà cho phép nông dân chụp ảnh, tự động định danh mã lô và gửi dữ liệu ngay cả khi vườn mất sóng internet.</p>
          </article>
          <article>
            <span>📦 Xưởng Đóng Gói / Sơ Chế</span>
            <h3>Bàn giao & chứng nhận chất lượng</h3>
            <p>Đối chiếu khối lượng thực tế, gộp nhiều lô nông sản vào thùng/pallet và đính kèm giấy chứng nhận VietGAP, GlobalGAP, kiểm dịch xuất khẩu.</p>
          </article>
          <article>
            <span>🌍 Nhà Nhập Khẩu / Người Tiêu Dùng</span>
            <h3>Quét QR & tra cứu minh bạch</h3>
            <p>Quét mã QR trên tem nhãn để xem trọn vẹn hành trình, điểm tin cậy chất lượng và đối chiếu mã xác thực bảo mật trên sổ cái Blockchain.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
