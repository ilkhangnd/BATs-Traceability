import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const polygon = {
  type: "Polygon",
  coordinates: [
    [
      [108.122675, 12.678175],
      [108.124125, 12.678175],
      [108.124125, 12.679625],
      [108.122675, 12.679625],
      [108.122675, 12.678175]
    ]
  ]
};

try {
  await prisma.actor.upsert({
    where: { id: "ADMIN-0001" },
    update: {},
    create: {
      id: "ADMIN-0001",
      name: "BATS Administrator",
      email: process.env.ADMIN_EMAIL ?? "admin@bats.vn",
      role: "ADMIN",
      organization: "BATS"
    }
  });
  await prisma.actor.upsert({
    where: { id: "FARMER-0001" },
    update: {},
    create: {
      id: "FARMER-0001",
      name: "Nguyễn Văn Minh",
      phone: "0900000001",
      role: "FARMER",
      organization: "HTX Ea Yông"
    }
  });
  await prisma.$executeRaw`
    INSERT INTO farm_plots (
      id, farmer_id, farmer_name, planting_area_code, crop, variety, area_ha,
      province, district, commune, polygon_geojson, polygon, status
    )
    VALUES (
      'plot-dlk-0001', 'FARMER-0001', 'Nguyễn Văn Minh', 'VN-DLK-PA-0001',
      'durian', 'Ri6', 2.5265, 'Đắk Lắk', 'Krông Pắc', 'Ea Yông',
      ${JSON.stringify(polygon)}::jsonb,
      ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(polygon)}), 4326),
      'active'
    )
    ON CONFLICT (id) DO UPDATE SET
      area_ha = EXCLUDED.area_ha,
      polygon_geojson = EXCLUDED.polygon_geojson,
      polygon = EXCLUDED.polygon,
      updated_at = now()
  `;
  console.log("Seeded BATS admin, farmer and sample farm plot.");
} finally {
  await prisma.$disconnect();
}
