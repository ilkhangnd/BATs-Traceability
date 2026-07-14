import Link from "next/link";

type Status = "live" | "prototype" | "prepared";

function NodeCard({
  code,
  title,
  description,
  status = "live"
}: {
  code: string;
  title: string;
  description: string;
  status?: Status;
}) {
  const labels: Record<Status, string> = {
    live: "Hoạt động chính thức",
    prototype: "Đã tích hợp Zalo/Web",
    prepared: "Sẵn sàng mở rộng"
  };
  return (
    <article className={`architectureNode ${status}`}>
      <div className="nodeTop">
        <span className="nodeCode">{code}</span>
        <span className="nodeStatus"><i />{labels[status]}</span>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flowArrow" aria-hidden="true">
      <span>{label}</span>
      <i />
    </div>
  );
}

export default function ArchitecturePage() {
  return (
    <main className="architecturePage">
      <section className="architectureHero">
        <div>
          <div className="eyebrow">KIẾN TRÚC HỆ THỐNG · CHUẨN TRUY XUẤT NÔNG SẢN BATS</div>
          <h1>Kiến trúc Minh bạch & Đơn giản cho Nông nghiệp.</h1>
        </div>
        <div className="architectureLead">
          <p>
            Hệ thống BATS được thiết kế linh hoạt, bảo mật và cực kỳ dễ sử dụng: kết nối trực tiếp từ nông hộ qua Zalo Mini App, kiểm định thực địa tự động và lưu trữ bằng chứng an toàn tuyệt đối trên Blockchain.
          </p>
          <div className="legend">
            <span className="legendLive"><i />Hoạt động chính thức</span>
            <span className="legendPrototype"><i />Đã tích hợp Zalo/Web</span>
            <span className="legendPrepared"><i />Sẵn sàng mở rộng</span>
          </div>
        </div>
      </section>

      <section className="architectureCanvas" aria-label="Sơ đồ kiến trúc triển khai BATS">
        <div className="architectureLayer clientLayer">
          <div className="layerHeading">
            <span>01</span>
            <div><strong>Lớp Giao diện Người dùng (Điểm chạm thực tế)</strong><small>Kết nối đơn giản cho từng vai trò trong chuỗi cung ứng</small></div>
          </div>
          <div className="nodeGrid three">
            <NodeCard code="QR" title="Tra cứu Nguồn gốc (Mã QR)" description="Người tiêu dùng quét mã tra cứu toàn bộ nhật ký lô hàng, hình ảnh thực địa và bằng chứng minh bạch." />
            <NodeCard code="ZA" title="Zalo Mini App Nông hộ" description="Ứng dụng cho nông dân ghi nhận thu hoạch ngay trên Zalo, hoạt động mượt mà cả khi ở vườn mất mạng internet." />
            <NodeCard code="WD" title="Cổng Quản trị & Điều hành" description="Giao diện dành cho hợp tác xã và nhà quản lý theo dõi vùng trồng, kiểm soát lô hàng và cảnh báo rủi ro." />
          </div>
        </div>

        <FlowArrow label="Đồng bộ dữ liệu nhanh chóng & hoạt động không cần mạng liên tục" />

        <div className="architectureLayer coreLayer">
          <div className="layerHeading">
            <span>02</span>
            <div><strong>Lớp Xử lý Nghiệp vụ & Chuẩn hóa Dữ liệu</strong><small>Tiếp nhận, chuẩn hóa và xác minh trung thực dữ liệu nông nghiệp</small></div>
          </div>
          <div className="nodeGrid four">
            <NodeCard code="AU" title="Quản lý Người dùng & Phân quyền" description="Định danh an toàn cho Nông dân, Hợp tác xã, Thương lái, Doanh nghiệp và Cơ quan kiểm định." />
            <NodeCard code="EP" title="Nhật ký Chuỗi Cung ứng" description="Ghi nhận chuẩn xác các sự kiện thu hoạch, đóng gói, vận chuyển theo tiêu chuẩn truy xuất quốc tế." />
            <NodeCard code="EV" title="Xác thực Hình ảnh & Phiếu cân" description="Đảm bảo hình ảnh thực địa, tọa độ GPS và chứng từ thu hoạch nguyên bản, chống chỉnh sửa." />
            <NodeCard code="FP" title="Bản đồ Vùng trồng (GPS)" description="Lưu trữ chính xác ranh giới vườn cây (Polygon GPS) để ngăn chặn việc lấy nông sản bên ngoài gán vào lô hàng." />
          </div>
        </div>

        <div className="splitConnector">
          <FlowArrow label="Kiểm tra tự động trước khi lưu" />
          <FlowArrow label="Lưu trữ dữ liệu an toàn" />
        </div>

        <div className="architectureSplit">
          <div className="architectureLayer validationLayer">
            <div className="layerHeading compact">
              <span>03A</span>
              <div><strong>Lớp Kiểm tra Rủi ro Tự động</strong><small>Hệ thống kiểm định thông minh ngay tại vườn</small></div>
            </div>
            <div className="validationPipeline">
              <NodeCard code="RE" title="Bộ 6 Tiêu chí Kiểm tra Thực tế" description="Kiểm tra tự động: Tọa độ GPS thu hoạch, Năng suất tối đa, Trùng lặp hình ảnh, Thời gian, Quy trình và Trọng lượng." />
              <div className="miniArrow">↓</div>
              <NodeCard code="RS" title="Chấm Điểm Tin Cậy (0 – 100 điểm)" description="Vùng Xanh: Hợp lệ tự duyệt · Vùng Vàng: Cần kiểm tra bổ sung · Vùng Đỏ: Chặn lô hàng gian lận." />
            </div>
          </div>

          <div className="architectureLayer storageLayer">
            <div className="layerHeading compact">
              <span>03B</span>
              <div><strong>Lớp Lưu trữ Dữ liệu Bền vững</strong><small>Tách biệt dữ liệu vận hành và bằng chứng bảo mật</small></div>
            </div>
            <div className="nodeGrid two">
              <NodeCard code="DB" title="Cơ sở Dữ liệu Bản đồ & Nghiệp vụ" description="Hệ thống cơ sở dữ liệu tích hợp bản đồ không gian lưu trữ an toàn toàn bộ quy trình." />
              <NodeCard code="OS" title="Kho Hình ảnh & Chứng từ Nguyên bản" description="Lưu giữ hình ảnh thực địa và phiếu cân với mã xác thực số chống làm giả." />
            </div>
          </div>
        </div>

        <FlowArrow label="Đóng gói & khóa bảo mật định kỳ" />

        <div className="architectureLayer chainLayer">
          <div className="layerHeading">
            <span>04</span>
            <div><strong>Lớp Bảo mật Bất biến (Blockchain)</strong><small>Lưu trữ minh bạch, không thể chỉnh sửa hay làm giả</small></div>
          </div>
          <div className="chainFlow">
            <NodeCard code="MT" title="Khóa Minh bạch Hàng ngày" description="Đóng gói toàn bộ nhật ký thu hoạch trong ngày thành một mã bảo mật duy nhất, tối ưu chi phí và bảo vệ bí mật kinh doanh." />
            <div className="horizontalArrow"><span>Khóa bảo mật</span><i /></div>
            <NodeCard code="SC" title="Hợp đồng Sổ cái Bất biến" description="Lưu giữ mã xác thực trên sổ cái Blockchain, giúp đối tác quốc tế kiểm chứng độc lập độ trung thực của dữ liệu." />
          </div>
        </div>
      </section>

      <section className="implementationStatus">
        <div className="sectionIntro">
          <div><div className="eyebrow">HIỆN TRẠNG TRIỂN KHAI HỆ THỐNG</div><h2>Sẵn sàng phục vụ chuỗi nông sản đặc sản Việt Nam.</h2></div>
          <p>Toàn bộ các thành phần của hệ thống đã được đồng bộ, vận hành trơn tru và dễ dàng cho mọi nông hộ sử dụng.</p>
        </div>
        <div className="repoMap">
          <article><span>Cổng Web Dashboard</span><strong>Cổng Thông tin & Quản trị</strong><p>Giao diện tra cứu minh bạch cho người tiêu dùng và bảng điều hành cho hợp tác xã.</p></article>
          <article><span>Zalo Mini App</span><strong>Ứng dụng Nông hộ Zalo</strong><p>Công cụ ghi nhận thu hoạch đơn giản bằng nút bấm lớn ngay trên điện thoại di động.</p></article>
          <article><span>Backend Service</span><strong>Hệ thống Xử lý Trung tâm</strong><p>Tiếp nhận dữ liệu, kiểm tra tự động 6 quy tắc rủi ro thực địa và khóa bảo mật.</p></article>
          <article><span>Blockchain & PostGIS</span><strong>Hạ tầng Bảo mật & Bản đồ</strong><p>Lưu trữ bản đồ vùng trồng GPS và neo bằng chứng bất biến trên sổ cái bảo mật.</p></article>
        </div>
        <div className="nextMilestone">
          <div><span>HỆ THỐNG HOÀN CHỈNH</span><h3>BATS đã kết nối thành công dữ liệu từ nông hộ, kiểm định tự động và chốt mã bảo mật Blockchain.</h3></div>
          <Link className="button primary" href="/dashboard/batches">Mở Bảng điều hành chuỗi</Link>
        </div>
      </section>
    </main>
  );
}
