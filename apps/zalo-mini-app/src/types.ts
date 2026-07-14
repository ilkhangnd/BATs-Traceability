export interface FarmPlot {
  id: string;
  name: string;
  cropType: string;
  areaHa: number;
  centerLat: number;
  centerLng: number;
  expectedYieldKg: number;
}

export const PRESET_PLOTS: FarmPlot[] = [
  {
    id: "plot-dlk-0001",
    name: "Ea Yông - Đắk Lắk (Lô Lõi A1)",
    cropType: "Ri6",
    areaHa: 2.5265,
    centerLat: 12.6789,
    centerLng: 108.1234,
    expectedYieldKg: 84000
  },
  {
    id: "plot-dlk-0003",
    name: "Cư M'gar - Đắk Lắk (Cà phê Robusta)",
    cropType: "Robusta Sẻ",
    areaHa: 4.8,
    centerLat: 12.822,
    centerLng: 108.082,
    expectedYieldKg: 130000
  },
  {
    id: "plot-bth-0004",
    name: "Hàm Mỹ - Bình Thuận (Thanh long Ruột Đỏ)",
    cropType: "Ruột Đỏ LĐ1",
    areaHa: 1.85,
    centerLat: 10.892,
    centerLng: 108.013,
    expectedYieldKg: 100000
  }
];

export interface BatchSummary {
  batchId: string;
  cropType: string;
  quantityKg: number;
  status: string;
  timestamp: string;
  plotId: string;
}
