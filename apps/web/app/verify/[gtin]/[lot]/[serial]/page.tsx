import Link from "next/link";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function getTrace(params: { gtin: string; lot: string; serial: string }) {
  try {
    const response = await fetch(`${api}/verify/${params.gtin}/${params.lot}/${params.serial}`, {
      cache: "no-store"
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

function getCropAndOriginInfo(batch: any): { name: string; icon: string; code: string; location: string } {
  const crop = batch?.crop || "";
  const lot = batch?.identity?.lot || batch?.id || "";
  if (crop === "durian" || lot.startsWith("SR-")) {
    return { name: "Sầu riêng", icon: "🍈", code: batch.farmPlotId || "VN-DLK-PA-0001", location: "Ea Yông, Krông Pắc, Đắk Lắk" };
  }
  if (crop === "mango" || lot.startsWith("XC-")) {
    return { name: "Xoài Cát", icon: "🥭", code: batch.farmPlotId || "VN-TGG-PA-0002", location: "Cái Bè, Tiền Giang" };
  }
  if (crop === "coffee" || lot.startsWith("CP-")) {
    return { name: "Cà phê", icon: "☕", code: batch.farmPlotId || "VN-DLK-PA-0003", location: "Cư M'gar, Đắk Lắk" };
  }
  if (crop === "dragon_fruit" || lot.startsWith("TL-")) {
    return { name: "Thanh long", icon: "🐲", code: batch.farmPlotId || "VN-BTH-PA-0004", location: "Hàm Thuận Nam, Bình Thuận" };
  }
  if (crop === "pomelo" || lot.startsWith("BD-")) {
    return { name: "Bưởi Da Xanh", icon: "🍊", code: batch.farmPlotId || "VN-BTR-PA-0005", location: "Châu Thành, Bến Tre" };
  }
  if (crop === "longan" || lot.startsWith("HY-")) {
    return { name: "Nhãn Lồng Hương Chi", icon: "🍒", code: batch.farmPlotId || "VN-HY-PA-0006", location: "Khoái Châu, Hưng Yên" };
  }
  if (crop === "avocado" || lot.startsWith("LD-")) {
    return { name: "Bơ Sáp 034", icon: "🥑", code: batch.farmPlotId || "VN-LD-PA-0007", location: "Bảo Lộc, Lâm Đồng" };
  }
  if (crop === "mangosteen" || lot.startsWith("MC-")) {
    return { name: "Măng Cụt Lái Thiêu", icon: "🟣", code: batch.farmPlotId || "VN-BD-PA-0008", location: "Thuận An, Bình Dương" };
  }
  return { name: "Nông sản Việt Nam", icon: "🌿", code: batch.farmPlotId || "VN-PA-GENERIC", location: "Thông tin vùng trồng theo hồ sơ lô" };
}

export default async function VerifyPage({
  params
}: {
  params: Promise<{ gtin: string; lot: string; serial: string }>;
}) {
  const identity = await params;
  const data = await getTrace(identity);
  if (!data) {
    return <main className="shell"><div className="empty"><h1>Chưa tìm thấy lô</h1><p>Hãy khởi động backend hoặc kiểm tra lại Digital Link.</p><Link href="/">Về trang chủ</Link></div></main>;
  }
  const { batch, anchor, proofs = [] } = data;
  const proofValid = proofs.length > 0 && proofs.every((proof: any) => proof.proofValid);
  const onChain = anchor.contractVerified === true;
  const cropInfo = getCropAndOriginInfo(batch);

  return (
    <main className="verifyShell">
      <section className="verifyHero">
        <div className="verifiedSeal">✓</div>
        <div>
          <div className="eyebrow">
            {onChain ? "COMMITMENT BẰNG CHỨNG ĐÃ ĐƯỢC XÁC MINH TRÊN CHUỖI" : "COMMITMENT BẰNG CHỨNG ĐANG CHỜ NEO"}
          </div>
          <h1>{cropInfo.icon} {cropInfo.name} {batch.variety ? `· ${batch.variety}` : ""}</h1>
          <p>Lô <strong>{batch.id}</strong> · {batch.quantityKg.toLocaleString("vi-VN")} kg</p>
        </div>
        <div className={`scoreCard ${batch.riskBand}`}><span>Chỉ số PCIE</span><strong>{batch.riskScore}</strong><small>{batch.riskBand === "green" ? "Không có cảnh báo theo luật hiện hành" : "Cần rà soát bổ sung"}</small></div>
      </section>
      <div className="verifyGrid">
        <section className="panel tracePanel">
          <div className="panelTitle"><h2>Hành trình lô hàng</h2><span>Chuẩn Truy Xuất Quốc Tế</span></div>
          <div className="timeline">
            {batch.events.map((event: any, index: number) => (
              <article key={event.id}>
                <div className="timelineDot">{index + 1}</div>
                <div><span>{new Date(event.eventTime).toLocaleString("vi-VN")}</span><h3>{event.status}</h3><p>Người ghi nhận: {event.actorId}</p><code>{event.eventHash.slice(0, 18)}…</code><p>{proofs[index]?.proofValid ? `✓ Hash bằng chứng khớp commitment` : "⚠ Bằng chứng chưa có proof neo"}</p></div>
              </article>
            ))}
          </div>
        </section>
        <aside>
          <section className="proofCard">
            <div className="proofIcon">{proofValid ? "✓" : "!"}</div>
            <h2>{proofValid ? "Commitment bằng chứng khớp" : "Đang kiểm tra commitment"}</h2>
            <p>
              {onChain
                ? "Hash của bằng chứng đang hiển thị khớp với commitment đã neo. Kết quả này hỗ trợ phát hiện thay đổi sau khi cam kết, không thay thế việc xác minh thực địa dữ liệu đầu vào."
                : "Dữ liệu hiển thị đang chờ hoặc chưa có commitment blockchain có thể kiểm tra. Trạng thái validation và bằng chứng gốc vẫn cần được xem xét theo quy trình."}
            </p>
            <dl><div><dt>Lược đồ dữ liệu</dt><dd>{anchor.schemaVersion}</dd></div><div><dt>Ngày neo</dt><dd>{anchor.date}</dd></div><div><dt>Trạng thái chuỗi</dt><dd>{anchor.chainStatus}</dd></div></dl>
            <code className="rootHash">{anchor.merkleRoot}</code>
            {anchor.txHash && <code className="rootHash">Tx: {anchor.txHash}</code>}
            <div className="formActions">
              {["json", "csv", "pdf"].map((format) => (
                <a
                  className="button secondary"
                  key={format}
                  href={`${api}/verify/${identity.gtin}/${identity.lot}/${identity.serial}/export/${format}`}
                >
                  {format.toUpperCase()}
                </a>
              ))}
            </div>
          </section>
          <section className="originCard">
            <span>Vùng trồng / Mã số</span>
            <strong>{cropInfo.code}</strong>
            <p>📍 {cropInfo.location}</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
