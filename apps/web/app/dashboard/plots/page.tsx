"use client";

import { useEffect, useState } from "react";
import GoogleMap, { type MapPlot } from "../../components/GoogleMap";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Plot = MapPlot & {
  farmerName: string;
  areaHa: number;
  variety: string;
  province: string;
  district: string;
  commune: string;
};

export default function PlotsPage() {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch(`${api}/plots?pageSize=100`)
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((page) => setPlots(page.items))
      .catch(() => setError("Không kết nối được backend."));
  }, []);

  return (
    <main className="shell">
      <div className="pageHeading">
        <div><div className="eyebrow">BẢN ĐỒ VÙNG TRỒNG · TOẠ ĐỘ GPS HỢP LỆ</div><h1>Bản đồ Vùng trồng Nông sản</h1></div>
      </div>
      {error && <div className="notice">{error}</div>}
      <GoogleMap plots={plots} />
      <div className="plotGrid mapPlotGrid">
        {plots.map((plot) => (
          <article className="plotCard" key={plot.id}>
            <div className="plotBody">
              <span className="status">Đang hoạt động</span>
              <h2>{plot.plantingAreaCode}</h2>
              <p>{plot.commune}, {plot.district}, {plot.province}</p>
              <dl><div><dt>Diện tích</dt><dd>{plot.areaHa} ha</dd></div><div><dt>Chủ hộ</dt><dd>{plot.farmerName}</dd></div></dl>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
