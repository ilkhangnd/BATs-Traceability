import React, { useState } from "react";
import { Sprout, Layers, History, User, CheckCircle2, BookOpen, ChevronRight, ShieldCheck, HelpCircle, PackageCheck } from "lucide-react";
import { BatsZaloSession } from "../zalo-session.js";

interface HomePageProps {
  session: BatsZaloSession | null;
  isOnline: boolean;
  queueCount: number;
  onNavigateTab: (tab: "harvest" | "queue" | "history" | "profile") => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  session,
  isOnline,
  queueCount,
  onNavigateTab
}) => {
  const [selectedGuide, setSelectedGuide] = useState<number | null>(null);
  const justifiedText = { textAlign: "justify" as const, textJustify: "inter-word" as const };
  const isCollector = session?.actor.role === "COLLECTOR";
  const audienceLabel = isCollector ? "Thương lái:" : "Hộ nông dân:";

  const shortcuts = [
    {
      id: "harvest",
      title: isCollector ? "Nhận lô thu mua" : "Chốt lô mới",
      subtitle: isCollector ? "Ghi nhận từ QR" : "Ghi chép tại vườn",
      icon: isCollector ? <PackageCheck size={26} color="#ffffff" /> : <Sprout size={26} color="#ffffff" />,
      bg: "linear-gradient(135deg, #155d3b, #0c3e29)",
      badge: null,
      tab: "harvest" as const
    },
    {
      id: "queue",
      title: "Hàng chờ gửi",
      subtitle: isCollector ? "Phiếu thu mua offline" : "Lưu khi mất mạng",
      icon: <Layers size={26} color="#ffffff" />,
      bg: "linear-gradient(135deg, #1c7c50, #155d3b)",
      badge: queueCount > 0 ? queueCount : null,
      tab: "queue" as const
    },
    {
      id: "history",
      title: "Lịch sử lô",
      subtitle: isCollector ? "Các phiếu đã nhận" : "Các lô đã chốt",
      icon: <History size={26} color="#ffffff" />,
      bg: "linear-gradient(135deg, #2a8a5e, #155d3b)",
      badge: null,
      tab: "history" as const
    },
    {
      id: "profile",
      title: isCollector ? "Hồ sơ thương lái" : "Hồ sơ nông hộ",
      subtitle: "Sửa tên, SĐT",
      icon: <User size={26} color="#ffffff" />,
      bg: "linear-gradient(135deg, #0c3e29, #08291b)",
      badge: null,
      tab: "profile" as const
    }
  ];

  const farmerGuides = [
    {
      id: 1,
      title: "Cách ghi chép lô thu hoạch nông sản ngay tại vườn",
      desc: "Đứng tại rẫy, nhập tên vườn, sản lượng và ảnh thực tế để tạo mã lô thu hoạch.",
      content: (
        <div style={{ fontSize: "14px", lineHeight: "1.65", color: "#172019", ...justifiedText }}>
          <p style={{ fontWeight: 700, color: "#155d3b", marginBottom: "8px", textAlign: "left" }}>Các bước thực hiện nhanh tại vườn:</p>
          <ol style={{ paddingLeft: "20px", marginBottom: "12px", ...justifiedText }}>
            <li style={{ marginBottom: "6px" }}>Mở mục <strong>Chốt lô</strong>, nhập tên vườn thu hoạch thực tế.</li>
            <li style={{ marginBottom: "6px" }}>Nhập loại nông sản, số ký vừa hái và kiểm tra vị trí GPS.</li>
            <li style={{ marginBottom: "6px" }}>Chụp ảnh giỏ quả hoặc phiếu cân để làm minh chứng.</li>
            <li>Bấm <strong>Xác nhận chốt lô</strong> để lưu vào lịch sử và đồng bộ khi có mạng.</li>
          </ol>
        </div>
      )
    },
    {
      id: 2,
      title: "Khi rẫy bị mất sóng thì làm sao?",
      desc: "Ứng dụng vẫn lưu lô vào hàng chờ trên máy và gửi lại khi có kết nối.",
      content: (
        <div style={{ fontSize: "14px", lineHeight: "1.65", color: "#172019", ...justifiedText }}>
          <p style={{ marginBottom: "8px", ...justifiedText }}>Nếu đang ở khu vực yếu sóng, cứ ghi nhận lô như bình thường. Lô sẽ nằm trong mục <strong>Hàng chờ</strong> của đúng tài khoản đang đăng nhập.</p>
          <p style={{ ...justifiedText }}>Khi điện thoại có 4G hoặc Wi-Fi, mở lại app và bấm <strong>Đồng bộ ngay</strong> để đẩy dữ liệu lên hệ thống BATS.</p>
        </div>
      )
    },
    {
      id: 3,
      title: "Cách đưa mã QR cho thương lái và hợp tác xã tra cứu",
      desc: "Dùng lịch sử lô để chứng minh nguồn gốc và thời điểm thu hoạch.",
      content: (
        <div style={{ fontSize: "14px", lineHeight: "1.65", color: "#172019", ...justifiedText }}>
          <ol style={{ paddingLeft: "20px", marginBottom: "12px", ...justifiedText }}>
            <li style={{ marginBottom: "6px" }}>Vào mục <strong>Lịch sử</strong> sau khi chốt lô.</li>
            <li style={{ marginBottom: "6px" }}>Mở cổng kiểm chứng GS1 của lô cần giao.</li>
            <li>Đưa mã cho thương lái hoặc hợp tác xã kiểm tra thông tin thu hoạch.</li>
          </ol>
        </div>
      )
    }
  ];

  const collectorGuides = [
    {
      id: 1,
      title: "Cách ghi nhận lô thu mua từ nông dân",
      desc: "Nhập mã lô hoặc QR GS1, số điện thoại nông dân và khối lượng cân nhận.",
      content: (
        <div style={{ fontSize: "14px", lineHeight: "1.65", color: "#172019", ...justifiedText }}>
          <ol style={{ paddingLeft: "20px", marginBottom: "12px", ...justifiedText }}>
            <li style={{ marginBottom: "6px" }}>Mở mục <strong>Thu mua</strong> khi nhận hàng tại vườn hoặc điểm cân.</li>
            <li style={{ marginBottom: "6px" }}>Nhập mã lô/QR GS1 do nông dân cung cấp và số điện thoại nông dân.</li>
            <li style={{ marginBottom: "6px" }}>Nhập khối lượng cân nhận thực tế, đo GPS điểm nhận và chụp phiếu cân.</li>
            <li>Bấm <strong>Xác nhận nhận lô</strong> để tạo phiếu thu mua.</li>
          </ol>
        </div>
      )
    },
    {
      id: 2,
      title: "Khi điểm thu mua mất mạng thì xử lý thế nào?",
      desc: "Phiếu thu mua được giữ trong hàng chờ của riêng tài khoản thương lái.",
      content: (
        <div style={{ fontSize: "14px", lineHeight: "1.65", color: "#172019", ...justifiedText }}>
          <p style={{ marginBottom: "8px", ...justifiedText }}>Nếu mạng yếu lúc cân hàng, ứng dụng sẽ lưu phiếu nhận lô vào <strong>Hàng chờ</strong>. Dữ liệu hàng chờ được lọc theo tài khoản đang đăng nhập, nên tài khoản khác sẽ không thấy phiếu này.</p>
          <p style={{ ...justifiedText }}>Khi có mạng, thương lái chỉ cần bấm <strong>Đồng bộ ngay</strong> để gửi phiếu lên hệ thống.</p>
        </div>
      )
    },
    {
      id: 3,
      title: "Cách kiểm chứng nguồn gốc trước khi nhận hàng",
      desc: "Dùng mã QR GS1 của nông dân để đối chiếu lô, sản lượng và thời gian thu hoạch.",
      content: (
        <div style={{ fontSize: "14px", lineHeight: "1.65", color: "#172019", ...justifiedText }}>
          <ol style={{ paddingLeft: "20px", marginBottom: "12px", ...justifiedText }}>
            <li style={{ marginBottom: "6px" }}>Yêu cầu nông dân cung cấp mã lô hoặc đường dẫn kiểm chứng GS1.</li>
            <li style={{ marginBottom: "6px" }}>Đối chiếu loại hàng, thời gian thu hoạch và thông tin vườn trước khi cân.</li>
            <li>Ghi nhận phiếu thu mua để nối tiếp chuỗi truy xuất từ nông dân sang thương lái.</li>
          </ol>
        </div>
      )
    }
  ];
  const guides = isCollector ? collectorGuides : farmerGuides;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", backgroundColor: "var(--farm-bg)", paddingBottom: "var(--sp-lg)", textAlign: "left" }}>
      {/* 1. Farmer Status Card (Compact: Hộ nông dân: ... and no GPS/Chuẩn badges) */}
      <div style={{ padding: "16px 16px 4px 16px" }}>
        <div style={{
          backgroundColor: "#ffffff",
          color: "#172019",
          borderRadius: "18px",
          padding: "16px 18px",
          border: "1px solid #dfe3da",
          boxShadow: "0 4px 14px rgba(21, 93, 59, 0.06)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "12.5px", color: "#667069", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {audienceLabel}
              </div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#155d3b", marginTop: "3px" }}>
                {session ? session.actor.name : "Đang kết nối thông tin hộ dân..."}
              </div>
            </div>
            <div style={{
              width: "46px",
              height: "46px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #155d3b, #0c3e29)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 3px 10px rgba(21,93,59,0.2)",
              flexShrink: 0
            }}>
              <User size={24} color="#ffffff" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tiện Ích Grid */}
      <div style={{ padding: "22px 16px 14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#0c3e29", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>{isCollector ? "Tiện ích dành cho thương lái" : "Tiện ích dành cho nông hộ"}</span>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
          {shortcuts.map((item) => (
            <div
              key={item.id}
              onClick={() => onNavigateTab(item.tab)}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                padding: "15px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                cursor: "pointer",
                boxShadow: "0 3px 10px rgba(23, 32, 25, 0.05)",
                border: "1px solid #dfe3da",
                position: "relative",
                transition: "transform 0.15s ease",
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {item.badge && (
                <div style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  backgroundColor: typeof item.badge === "number" ? "#d9534f" : "#155d3b",
                  color: "#ffffff",
                  fontSize: "10px",
                  fontWeight: 800,
                  padding: "2px 7px",
                  borderRadius: "10px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.15)"
                }}>
                  {item.badge}
                </div>
              )}
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: item.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "10px",
                boxShadow: "0 4px 10px rgba(21, 93, 59, 0.18)"
              }}>
                {item.icon}
              </div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#172019", marginBottom: "3px", lineHeight: "1.3" }}>
                {item.title}
              </div>
              <div style={{ fontSize: "11px", color: "#667069", lineHeight: "1.2" }}>
                {item.subtitle}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Sổ Tay Hướng Dẫn */}
      <div style={{ padding: "12px 16px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#0c3e29", display: "flex", alignItems: "center", gap: "8px" }}>
            <HelpCircle size={18} color="#155d3b" />
            <span>{isCollector ? "Sổ tay hướng dẫn thương lái" : "Sổ tay hướng dẫn nhà nông"}</span>
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {guides.map((guide) => {
            const isExpanded = selectedGuide === guide.id;
            return (
              <div
                key={guide.id}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  border: isExpanded ? "2px solid #155d3b" : "1px solid #dfe3da",
                  overflow: "hidden",
                  boxShadow: "0 3px 8px rgba(0,0,0,0.03)"
                }}
              >
                <div
                  onClick={() => setSelectedGuide(isExpanded ? null : guide.id)}
                  style={{
                    padding: "15px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    backgroundColor: isExpanded ? "#e8f0eb" : "#ffffff"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1 }}>
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "10px",
                      backgroundColor: "#e8f0eb",
                      color: "#155d3b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "14px",
                      flexShrink: 0
                    }}>
                      {guide.id}
                    </div>
                    <div style={{ textAlign: "left", flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#172019", marginBottom: "4px" }}>
                        {guide.title}
                      </div>
                      <div style={{ fontSize: "12.5px", color: "#667069", lineHeight: "1.45", ...justifiedText }}>
                        {guide.desc}
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    color="#155d3b"
                    style={{
                      transform: isExpanded ? "rotate(90deg)" : "none",
                      transition: "transform 0.2s ease",
                      flexShrink: 0,
                      marginLeft: "8px"
                    }}
                  />
                </div>

                {isExpanded && (
                  <div style={{
                    padding: "16px",
                    borderTop: "1px dashed #dfe3da",
                    backgroundColor: "#fcfcfb",
                    textAlign: "left"
                  }}>
                    {guide.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
