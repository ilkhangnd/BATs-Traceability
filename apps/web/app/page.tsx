import Image from "next/image";
import Link from "next/link";
import {
  SproutIcon,
  UsersIcon,
  PlotIcon,
  LockIcon,
  AuditIcon,
  SyncIcon,
  QrIcon,
  CheckCircleIcon,
  ScaleIcon,
  BoxIcon,
  BellIcon,
  FilterIcon,
  MapPinIcon,
  AlertIcon
} from "./components/Icons";

const supplyChainSteps = [
  {
    role: "Vùng trồng & Nông hộ",
    desc: "Ghi nhận GPS & Nhật ký thực địa tại vườn",
    icon: SproutIcon,
    badge: "Đã ký số #R-1549",
    color: "green"
  },
  {
    role: "Thương lái & Thu mua",
    desc: "Quét QR nhận lô & Phiếu cân điện tử",
    icon: ScaleIcon,
    badge: "Khớp 1,250 Kg",
    color: "orange"
  },
  {
    role: "Hợp tác xã & Đóng gói",
    desc: "Chuẩn hóa tem GS1 Digital Link & Kiểm định",
    icon: BoxIcon,
    badge: "EPCIS 2.0 Ready",
    color: "blue"
  },
  {
    role: "Sổ cái Blockchain",
    desc: "Neo Merkle root bảo mật chống chỉnh sửa",
    icon: LockIcon,
    badge: "Block #4,812,901",
    color: "purple"
  }
];

const problems = [
  {
    title: "Mạo danh vùng trồng & Nguồn gốc",
    desc: "Đối chiếu tọa độ GPS thực địa với polygon vùng trồng đã đăng ký, phát hiện ngay sự cố lệch vị trí.",
    icon: MapPinIcon
  },
  {
    title: "Khai báo sản lượng bất thường",
    desc: "Hệ thống tự động kiểm tra năng suất tối đa theo diện tích vườn, ngăn chặn khai báo khống trọng lượng.",
    icon: AlertIcon
  },
  {
    title: "Dữ liệu giấy tờ dễ bị chỉnh sửa",
    desc: "Mỗi sự kiện thu hoạch và bàn giao đều được băm SHA-256 và neo bằng chứng lên Blockchain bất biến.",
    icon: LockIcon
  },
  {
    title: "Khó thao tác tại vùng sóng yếu",
    desc: "Zalo Mini App hỗ trợ cơ chế Offline-first, tự động lưu trữ hàng chờ khi mất mạng và đồng bộ khi có kết nối.",
    icon: SyncIcon
  }
];

const workflow = [
  {
    step: "01",
    title: "Nông dân tạo lô",
    desc: "Nhập thông tin giống cây, sản lượng dự kiến, chụp ảnh thực địa và lưu nhật ký ngay tại vườn."
  },
  {
    step: "02",
    title: "Hệ thống kiểm tra",
    desc: "Bộ máy kiểm duyệt rủi ro 6 bước đối chiếu tọa độ GPS, mã số nông hộ và lịch sử thu hoạch."
  },
  {
    step: "03",
    title: "Thương lái ghi nhận",
    desc: "Quét mã QR bàn giao, kiểm định trọng lượng thực tế tại điểm thu mua và xác nhận phiếu cân."
  },
  {
    step: "04",
    title: "Chuẩn hóa GS1 EPCIS",
    desc: "Dữ liệu chuỗi sự kiện được chuẩn hóa theo chuẩn quốc tế GS1 EPCIS 2.0, tạo cây Merkle hàng ngày."
  },
  {
    step: "05",
    title: "Người mua tra cứu",
    desc: "Người tiêu dùng hoặc đối tác nhập khẩu quét tem GS1 Digital Link để kiểm chứng toàn bộ hành trình."
  }
];

const audiences = [
  {
    title: "Nông dân / Chủ vườn",
    icon: SproutIcon,
    items: [
      "Tạo lô thu hoạch siêu tốc ngay trên điện thoại",
      "Lưu trữ nhật ký offline không lo mất sóng",
      "Tạo mã QR định danh cho từng lô hàng"
    ],
    target: "/portal?role=farmer"
  },
  {
    title: "Thương lái / Điểm thu mua",
    icon: ScaleIcon,
    items: [
      "Quét mã QR nhận bàn giao chỉ trong 3 giây",
      "Ghi nhận và khớp phiếu cân trọng lượng",
      "Giảm thiểu sai lệch dữ liệu với nông dân"
    ],
    target: "/portal?role=collector"
  },
  {
    title: "Hợp tác xã & Doanh nghiệp",
    icon: BoxIcon,
    items: [
      "Quản lý tổng thể vùng trồng & nông hộ thành viên",
      "Phát hành tem GS1 Digital Link xuất khẩu",
      "Xuất báo cáo truy xuất nguồn gốc chuẩn quốc tế"
    ],
    target: "/portal?role=cooperative"
  },
  {
    title: "Người mua & Đối tác xuất khẩu",
    icon: AuditIcon,
    items: [
      "Kiểm chứng tính xác thực bằng chứng Blockchain",
      "Xem minh bạch toàn bộ hành trình từ vườn trồng",
      "Kết nối dữ liệu liên thông qua API chuẩn EPCIS"
    ],
    target: "/verify/8930000000019/SR-20260704-000001/0001"
  }
];

const features = [
  { title: "Chuẩn GS1 EPCIS 2.0", icon: AuditIcon, desc: "Liên thông dữ liệu toàn cầu" },
  { title: "GS1 Digital Link & QR", icon: QrIcon, desc: "Tem truy xuất thông minh đa tầng" },
  { title: "GPS Polygon & PostGIS", icon: PlotIcon, desc: "Xác thực ranh giới vùng trồng" },
  { title: "Cơ chế Offline-first", icon: SyncIcon, desc: "Hoạt động mượt mà khi mất mạng" },
  { title: "Kiểm duyệt Rủi ro 6 bước", icon: CheckCircleIcon, desc: "Phát hiện gian lận sản lượng tự động" },
  { title: "Blockchain Merkle Root", icon: LockIcon, desc: "Neo bằng chứng bất biến hàng ngày" }
];

export default function Home() {
  return (
    <main className="landingPageModern">
      {/* HERO SECTION */}
      <section className="landingHeroModern">
        <div className="heroContentModern">
          <div className="heroBadgePulse">
            <span className="pulseIndicator" />
            <strong>BATS Traceability v1.0</strong>
            <span>• Nền tảng Nông nghiệp Số chuẩn Blockchain</span>
          </div>

          <h1 className="heroTitleModern">
            Truy xuất nguồn gốc nông sản minh bạch <span className="highlightText">từ vườn đến thị trường</span>
          </h1>

          <p className="heroDescModern">
            BATS kết nối Nông dân, Thương lái, Hợp tác xã và Doanh nghiệp trên một nền tảng duy nhất. Chuẩn hóa hành trình nông sản theo định dạng <strong>GS1 EPCIS 2.0</strong> và neo bằng chứng bảo mật lên <strong>Blockchain</strong> không thể chỉnh sửa.
          </p>

          <div className="heroActionsModern">
            <Link className="button primary heroBtnPrimary" href="/verify/8930000000019/SR-20260704-000001/0001">
              Tra cứu nguồn gốc lô ngay <span className="arrowRight">→</span>
            </Link>
            <Link className="button secondary heroBtnSecondary" href="/login">
              Đăng nhập hệ thống
            </Link>
            <Link className="button secondary heroBtnPortal" href="/portal">
              <SproutIcon size={16} /> Sổ tay Nông hộ
            </Link>
          </div>

          <div className="heroTrustBarModern">
            <span><CheckCircleIcon size={15} /> Chuẩn GS1 EPCIS 2.0</span>
            <span className="dotSeparator">•</span>
            <span><CheckCircleIcon size={15} /> Neo SHA-256 Merkle Root</span>
            <span className="dotSeparator">•</span>
            <span><CheckCircleIcon size={15} /> Đồng bộ Zalo Mini App</span>
          </div>
        </div>

        {/* HERO RIGHT SHOWCASE PANEL */}
        <div className="heroShowcaseModern" aria-label="Hành trình nông sản trực quan">
          <div className="showcaseCardHeader">
            <div className="liveTrackingTitle">
              <span className="dotGreenLive" />
              <strong>LIVE TRACKING · LÔ SẦU RIÊNG RI6</strong>
            </div>
            <span className="batchIdBadge">#SR-20260715-DLK</span>
          </div>

          <div className="supplyChainStackModern">
            {supplyChainSteps.map((step, idx) => {
              const IconComponent = step.icon;
              return (
                <div key={step.role} className="supplyChainCardModern">
                  <div className={`stepIconCircle circle-${step.color}`}>
                    <IconComponent size={20} />
                  </div>
                  <div className="stepTextColumn">
                    <div className="stepTitleRow">
                      <strong>{step.role}</strong>
                      <span className={`statusTag tag-${step.color}`}>{step.badge}</span>
                    </div>
                    <p>{step.desc}</p>
                  </div>
                  {idx < supplyChainSteps.length - 1 && <div className="stepConnectorLine" />}
                </div>
              );
            })}
          </div>

          <div className="showcaseCardFooter">
            <LockIcon size={15} />
            <span>Bằng chứng bất biến công khai · Hash: <strong>0x8f9b...3c2a</strong></span>
          </div>
        </div>
      </section>

      {/* QUICK LOOKUP SECTION */}
      <section className="lookupSectionModern">
        <div className="lookupCardModern">
          <div className="lookupHeaderColumn">
            <div className="lookupIconCircle"><QrIcon size={24} /></div>
            <div>
              <h2>Tra cứu nhanh lô nông sản hoặc mã GS1</h2>
              <p>Nhập mã lô hàng, chuỗi định danh GS1 Digital Link hoặc quét tem QR trên sản phẩm.</p>
            </div>
          </div>
          <form className="lookupFormModern">
            <input placeholder="VD: SR-20260704-000001 hoặc 8930000000019/SR-20260704/0001..." aria-label="Mã lô" />
            <Link className="button primary lookupSubmitBtn" href="/verify/8930000000019/SR-20260704-000001/0001">
              Tra cứu hành trình →
            </Link>
          </form>
          <Link className="button secondary lookupQrBtn" href="/verify/8930000000019/SR-20260704-000001/0001">
            <QrIcon size={16} /> Quét QR bằng Camera
          </Link>
        </div>
      </section>

      {/* PROBLEMS & WORKFLOW SECTION */}
      <section className="twoColumnSectionModern">
        <div className="problemColumn">
          <div className="sectionHeadingRow">
            <h2>BATS giải quyết những vấn đề gì?</h2>
            <p>Khắc phục triệt để các hạn chế của phương thức quản lý nông sản truyền thống.</p>
          </div>
          <div className="problemGridModern">
            {problems.map((item) => {
              const IconComp = item.icon;
              return (
                <article key={item.title} className="featureCardModern">
                  <div className="featureCardIconBox"><IconComp size={22} /></div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="workflowColumn">
          <div className="sectionHeadingRow">
            <h2>BATS hoạt động như thế nào?</h2>
            <p>Quy trình 5 bước khép kín từ thực địa vườn trồng đến tay người tiêu dùng.</p>
          </div>
          <div className="workflowGridModern">
            {workflow.map((item) => (
              <article key={item.step} className="workflowCardModern">
                <div className="stepNumBadge">{item.step}</div>
                <div className="workflowCardText">
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* AUDIENCES & STATS SECTION */}
      <section className="audienceStatsSectionModern">
        <div className="audienceColumn">
          <div className="sectionHeadingRow">
            <h2>Dành cho ai?</h2>
            <p>Hệ thống được thiết kế riêng biệt và tối ưu thao tác cho từng vai trò trong chuỗi.</p>
          </div>
          <div className="audienceGridModern">
            {audiences.map((aud) => {
              const IconComp = aud.icon;
              return (
                <article key={aud.title} className="audienceCardModern">
                  <div className="audHeaderRow">
                    <div className="audIconBox"><IconComp size={20} /></div>
                    <h3>{aud.title}</h3>
                  </div>
                  <ul className="audListModern">
                    {aud.items.map((it) => (
                      <li key={it}>
                        <CheckCircleIcon size={14} className="checkItemIcon" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={aud.target} className="audExploreLink">
                    Vào cổng thông tin {aud.title.split(" / ")[0]} →
                  </Link>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="statsCardModern">
          <div className="statsCardHeader">
            <h2>BATS trong những con số</h2>
            <p>Khả năng mở rộng & tốc độ xử lý thực địa</p>
          </div>
          <dl className="statsListModern">
            <div className="statItemModern">
              <dt>&lt; 60 giây</dt>
              <dd>Thời gian nông dân hoàn tất tạo & chốt 1 lô thu hoạch ngay tại vườn</dd>
            </div>
            <div className="statItemModern">
              <dt>100% Minh bạch</dt>
              <dd>Dữ liệu gắn liền định danh GPS, chữ ký số và mốc thời gian thực tế</dd>
            </div>
            <div className="statItemModern">
              <dt>4+ Vai trò đồng bộ</dt>
              <dd>Nông dân, Thương lái, HTX và Quản trị viên cùng chung một nguồn dữ liệu</dd>
            </div>
            <div className="statItemModern">
              <dt>SHA-256 & Merkle</dt>
              <dd>Mã hóa chống chỉnh sửa, neo bằng chứng bảo mật lên Blockchain hàng ngày</dd>
            </div>
          </dl>
          <div className="statsFooterAction">
            <Link href="/architecture" className="statsTechLink">Xem chi tiết kiến trúc kỹ thuật →</Link>
          </div>
        </aside>
      </section>

      {/* FEATURES GRID SECTION */}
      <section className="featuresSectionModern">
        <div className="sectionHeadingRow center">
          <h2>Tính năng công nghệ cốt lõi</h2>
          <p>Sự kết hợp hoàn hảo giữa công nghệ thực địa IoT, chuẩn hóa toàn cầu GS1 và bảo mật Blockchain.</p>
        </div>
        <div className="featuresGridModern">
          {features.map((feat) => {
            const IconComp = feat.icon;
            return (
              <article key={feat.title} className="featureItemBoxModern">
                <div className="featIconCircleModern"><IconComp size={22} /></div>
                <div>
                  <strong>{feat.title}</strong>
                  <p>{feat.desc}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ECOSYSTEM SHOWCASE SECTION */}
      <section className="ecosystemSectionModern">
        <div className="sectionHeadingRow center">
          <h2>Một hệ sinh thái, đa nền tảng, đồng bộ thời gian thực.</h2>
          <p>Zalo Mini App siêu nhẹ phục vụ nông dân thực địa; Web Dashboard mạnh mẽ cho HTX và Quản trị viên.</p>
        </div>
        <div className="ecosystemGridModern">
          <div className="ecoCardModern">
            <div className="ecoImgWrap">
              <Image src="/images/farmer-check.png" alt="Zalo Mini App" width={320} height={190} className="ecoImg" />
            </div>
            <div className="ecoText">
              <strong>1. Zalo Mini App Thực Địa</strong>
              <p>Không cần tải hay cài đặt phức tạp. Nông dân mở Zalo là có thể ghi nhật ký và chụp ảnh vùng trồng.</p>
            </div>
          </div>
          <div className="ecoCardModern">
            <div className="ecoImgWrap">
              <Image src="/images/harvest-showcase.png" alt="Sổ tay Nông hộ Web" width={320} height={190} className="ecoImg" />
            </div>
            <div className="ecoText">
              <strong>2. Sổ Tay Nông Hộ & HTX (`/portal`)</strong>
              <p>Quản lý biểu đồ thu hoạch theo tháng, chốt lô hàng loạt, đồng bộ dữ liệu chờ và quản lý tem QR.</p>
            </div>
          </div>
          <div className="ecoCardModern">
            <div className="ecoImgWrap">
              <Image src="/images/farm-hero.png" alt="Trung tâm BATS Central" width={320} height={190} className="ecoImg" />
            </div>
            <div className="ecoText">
              <strong>3. BATS Central Control (`/admin`)</strong>
              <p>Hệ thống tự động phát hiện rủi ro mạo danh, kiểm duyệt vùng trồng GPS và chốt khóa Merkle Blockchain.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION SECTION */}
      <section className="ctaSectionModern">
        <div className="ctaContentModern">
          <h2>Sẵn sàng chuyển đổi số cho chuỗi nông sản đặc sản Việt Nam?</h2>
          <p>Khám phá giao diện quản trị, trải nghiệm Sổ tay nông hộ hoặc tra cứu ngay bằng chứng xác thực Blockchain.</p>
          <div className="ctaBtnGroupModern">
            <Link className="button primary ctaBtnMain" href="/verify/8930000000019/SR-20260704-000001/0001">
              Tra cứu mã lô ngay <span className="arrowRight">→</span>
            </Link>
            <Link className="button secondary ctaBtnLogin" href="/login">
              Đăng nhập / Phân quyền
            </Link>
            <Link className="button secondary ctaBtnPortal" href="/portal">
              Sổ tay Nông hộ & HTX
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
