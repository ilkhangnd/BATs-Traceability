import type { GeoPoint } from "@bats/shared-types";

function orientation(a: GeoPoint, b: GeoPoint, c: GeoPoint): number {
  return (
    (b.longitude - a.longitude) * (c.latitude - a.latitude) -
    (b.latitude - a.latitude) * (c.longitude - a.longitude)
  );
}

function intersects(a: GeoPoint, b: GeoPoint, c: GeoPoint, d: GeoPoint): boolean {
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);
  return abC * abD < 0 && cdA * cdB < 0;
}

export function validatePolygonShape(points: GeoPoint[]): string | undefined {
  if (!Array.isArray(points) || points.length < 3) {
    return "Polygon vùng trồng phải có ít nhất 3 điểm.";
  }
  for (const point of points) {
    if (
      !Number.isFinite(point.latitude) ||
      !Number.isFinite(point.longitude) ||
      point.latitude < -90 ||
      point.latitude > 90 ||
      point.longitude < -180 ||
      point.longitude > 180
    ) {
      return "Polygon chứa tọa độ không hợp lệ.";
    }
  }
  const unique = new Set(points.map((point) => `${point.latitude},${point.longitude}`));
  if (unique.size < 3) return "Polygon phải có ít nhất 3 tọa độ khác nhau.";
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]!;
    const b = points[(i + 1) % points.length]!;
    for (let j = i + 1; j < points.length; j += 1) {
      if (j === i || j === i + 1 || (i === 0 && j === points.length - 1)) continue;
      const c = points[j]!;
      const d = points[(j + 1) % points.length]!;
      if (intersects(a, b, c, d)) return "Polygon tự cắt và không tạo thành vùng hợp lệ.";
    }
  }
  return undefined;
}
