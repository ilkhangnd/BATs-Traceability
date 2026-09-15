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
    live: "Thành phần hiện có",
    prototype: "Phạm vi MVP/PoC",
    prepared: "Hướng mở rộng"
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

const workflowStages = [
  {
    number: "01",
    actor: "Nông dân / nông hộ",
    title: "Ghi nhận thu hoạch tại vùng trồng",
    description: "Tạo sự kiện thu hoạch kèm mã số vùng trồng, GPS, thời gian, khối lượng và ảnh/chứng từ làm bằng chứng.",
    checks: "PCIE kiểm tra G/I/S/Y/D/T: geofence, định danh, trạng thái, năng suất, trùng lặp và thời gian.",
    result: "PASS: lưu sự kiện; REVIEW: đưa vào hàng đợi; BLOCK: không tạo batch và trả lý do hiệu chỉnh."
  },
  {
    number: "02",
    actor: "Thương lái / đơn vị thu gom",
    title: "Quét mã và ghi nhận bàn giao",
    description: "Quét QR/Digital Link để xem tóm tắt batch; khi nhận hàng, ghi cân thực tế, GPS điểm nhận và bằng chứng bàn giao.",
    checks: "PCIE kiểm tra W/C cùng custody graph và mass balance để đối chiếu sự tiếp nối và khối lượng.",
    result: "Kết quả trả về xác nhận hoặc cảnh báo review để các bên tiếp tục xử lý theo quy trình."
  },
  {
    number: "03",
    actor: "Hợp tác xã / cơ sở đóng gói / doanh nghiệp",
    title: "Chuẩn hóa, neo bằng chứng và tra cứu",
    description: "Sự kiện được tổ chức theo EPCIS, tạo canonical envelope hash, gom Merkle batch và neo daily root lên EVM blockchain.",
    checks: "Website vận hành hiển thị provenance, PCIE result, custody/mass balance; QR công khai hiển thị dữ liệu phù hợp quyền truy cập.",
    result: "Anchor/proof giúp đối chiếu tính toàn vẹn sau cam kết; không tự khẳng định dữ liệu đầu vào là đúng."
  }
];

export default function ArchitecturePage() {
  return (
    <main className="architecturePage">
      <section className="architectureHero">
        <div>
          <div className="eyebrow">CÁCH BATS-AGRIGUARD HOẠT ĐỘNG</div>
          <h1>Từ ghi nhận tại vườn đến tra cứu lô hàng.</h1>
        </div>
        <div className="architectureLead">
          <p>
            Quy trình gồm ba chặng dễ theo dõi: ghi nhận tại vùng trồng, bàn giao/tiếp nhận và tra cứu. Ở mỗi chặng, dữ liệu được kiểm tra trước khi lưu; blockchain chỉ neo commitment bằng chứng sau khi dữ liệu đã được cam kết.
          </p>
          <div className="legend">
            <span className="legendLive"><i />Thành phần hiện có</span>
            <span className="legendPrototype"><i />Phạm vi MVP/PoC</span>
            <span className="legendPrepared"><i />Hướng mở rộng</span>
          </div>
        </div>
      </section>

      <section className="workflowExplainer" aria-labelledby="workflow-title">
        <div className="workflowExplainerIntro">
          <div>
            <div className="eyebrow">QUY TRÌNH NGHIỆP VỤ</div>
            <h2 id="workflow-title">Ba chặng, một chuỗi dữ liệu liên tục</h2>
          </div>
          <p>Phần này diễn giải workflow trước; sơ đồ kiến trúc bên dưới cho biết các thành phần phần mềm hiện thực hóa từng bước như thế nào.</p>
        </div>
        <ol className="workflowStageList">
          {workflowStages.map((stage) => (
            <li key={stage.number} className="workflowStage">
              <div className="workflowStageNumber" aria-hidden="true">{stage.number}</div>
              <div className="workflowStageBody">
                <span className="workflowStageActor">{stage.actor}</span>
                <h3>{stage.title}</h3>
                <p>{stage.description}</p>
                <dl>
                  <div><dt>Hệ thống kiểm tra</dt><dd>{stage.checks}</dd></div>
                  <div><dt>Kết quả xử lý</dt><dd>{stage.result}</dd></div>
                </dl>
              </div>
            </li>
          ))}
        </ol>
        <p className="workflowBoundary"><strong>Nguyên tắc xuyên suốt:</strong> validation diễn ra trước evidence hashing và blockchain anchoring; evidence anchor hỗ trợ kiểm toán tính toàn vẹn sau khi cam kết.</p>
      </section>

      <section className="architectureCanvas" aria-label="Sơ đồ kiến trúc triển khai BATS">
        <div className="architectureLayer clientLayer">
          <div className="layerHeading">
            <span>01</span>
            <div><strong>Lớp người dùng và thu thập dữ liệu</strong><small>Ghi nhận theo vai trò; gắn actor, thời gian, vị trí và bằng chứng</small></div>
          </div>
          <div className="nodeGrid three">
            <NodeCard code="QR" title="QR / Digital Link công khai" description="Tra cứu thông tin được công bố phù hợp với quyền truy cập: hành trình, trạng thái kiểm tra và trạng thái bằng chứng." />
            <NodeCard code="ZA" title="Zalo Mini App hiện trường" description="Nông dân và đơn vị thu gom ghi sự kiện thu hoạch/bàn giao, GPS, khối lượng và bằng chứng; hỗ trợ hàng chờ khi mất kết nối." />
            <NodeCard code="WD" title="Website registry & vận hành" description="Hợp tác xã và đơn vị quản lý đăng ký vùng trồng, quản lý actor, xử lý review và theo dõi chuỗi lô hàng." />
          </div>
        </div>

        <FlowArrow label="Data capture → đồng bộ/hàng chờ → Backend API" />

        <div className="architectureLayer coreLayer">
          <div className="layerHeading">
            <span>02</span>
            <div><strong>Lớp xử lý nghiệp vụ và chuẩn hóa dữ liệu</strong><small>Xác thực phiên, phân quyền và mô hình hóa sự kiện truy xuất</small></div>
          </div>
          <div className="nodeGrid four">
            <NodeCard code="AU" title="Authentication & Role Management" description="Quản lý actor và phạm vi quyền của nông dân, hợp tác xã, thu gom, đóng gói và doanh nghiệp." />
            <NodeCard code="EP" title="EPCIS Traceability Service" description="Tổ chức các sự kiện ObjectEvent/TransformationEvent theo actor, thời gian, địa điểm, batch/lot, lượng và bằng chứng." />
            <NodeCard code="EV" title="Evidence Capture & Hashing" description="Liên kết ảnh, phiếu cân và chứng từ với sự kiện; tạo dấu băm để phục vụ đối chiếu toàn vẹn sau này." />
            <NodeCard code="FP" title="Plantation Registry / PostGIS" description="Lưu mã vùng trồng, polygon, cây trồng và các thuộc tính phục vụ kiểm tra phù hợp không gian-thời gian." />
          </div>
        </div>

        <div className="splitConnector">
          <FlowArrow label="PCIE validation trước khi chấp nhận/đưa vào review" />
          <FlowArrow label="EPCIS Event Store và kho bằng chứng" />
        </div>

        <div className="architectureSplit">
          <div className="architectureLayer validationLayer">
            <div className="layerHeading compact">
              <span>03A</span>
              <div><strong>PCIE Validation Engine</strong><small>Kiểm tra tính nhất quán và phân luồng PASS / REVIEW / BLOCK</small></div>
            </div>
            <div className="validationPipeline">
              <NodeCard code="RE" title="Nhóm luật kiểm tra sự kiện" description="Location, actor/role, crop, yield, batch, timestamp, evidence; với các bàn giao bổ sung custody, mass balance và cross-event consistency." />
              <div className="miniArrow">↓</div>
              <NodeCard code="RS" title="Kết quả và hàng đợi rà soát" description="PASS được lưu theo chính sách; REVIEW chuyển hàng đợi có lý do; BLOCK từ chối tạo/tiếp tục sự kiện và yêu cầu hiệu chỉnh. Kết quả phản ánh kiểm tra quy tắc, không phải xác nhận tuyệt đối nguồn gốc." />
            </div>
          </div>

          <div className="architectureLayer storageLayer">
            <div className="layerHeading compact">
              <span>03B</span>
              <div><strong>Lớp dữ liệu truy xuất và bằng chứng</strong><small>Tách dữ liệu vận hành, chỉ mục không gian và đối tượng bằng chứng</small></div>
            </div>
            <div className="nodeGrid two">
              <NodeCard code="DB" title="EPCIS Event Store · PostgreSQL/PostGIS" description="Lưu sự kiện, quan hệ batch/custody, registry vùng trồng và dữ liệu phục vụ truy xuất, kiểm tra không gian-thời gian." />
              <NodeCard code="OS" title="Kho ảnh và chứng từ" description="Lưu đối tượng bằng chứng; canonical envelope/hash dùng để kiểm tra thay đổi của bằng chứng đã cam kết." />
            </div>
          </div>
        </div>

        <FlowArrow label="Canonical envelope hash → Merkle batch → EVM anchor" />

        <div className="architectureLayer chainLayer">
          <div className="layerHeading">
            <span>04</span>
            <div><strong>Lớp neo bằng chứng blockchain</strong><small>Cam kết tóm tắt dữ liệu để tăng khả năng kiểm toán sau khi validation</small></div>
          </div>
          <div className="chainFlow">
            <NodeCard code="MT" title="Canonical envelope & Merkle batch" description="Chuẩn hóa tập bằng chứng/sự kiện đã chọn, tạo hash và Merkle root để giảm dữ liệu cần neo và hỗ trợ tạo proof." />
            <div className="horizontalArrow"><span>Neo tóm tắt</span><i /></div>
            <NodeCard code="SC" title="EVM Blockchain Anchor" description="Lưu Merkle root hoặc commitment. Lớp này hỗ trợ phát hiện thay đổi sau khi cam kết; không tự xác minh dữ liệu đầu vào là đúng." />
          </div>
        </div>
      </section>

    </main>
  );
}
