import { describe, expect, it } from "vitest";
import { validatePolygonShape } from "./polygon.js";

describe("validatePolygonShape", () => {
  it("accepts a simple polygon", () => {
    expect(
      validatePolygonShape([
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 1 },
        { latitude: 1, longitude: 1 },
        { latitude: 1, longitude: 0 }
      ])
    ).toBeUndefined();
  });

  it("rejects out-of-range coordinates and self intersections", () => {
    expect(
      validatePolygonShape([
        { latitude: 91, longitude: 0 },
        { latitude: 0, longitude: 1 },
        { latitude: 1, longitude: 0 }
      ])
    ).toContain("tọa độ");
    expect(
      validatePolygonShape([
        { latitude: 0, longitude: 0 },
        { latitude: 1, longitude: 1 },
        { latitude: 0, longitude: 1 },
        { latitude: 1, longitude: 0 }
      ])
    ).toContain("tự cắt");
  });
});
