import { describe, expect, it } from "vitest";
import { AdminService } from "./admin.service.js";
import { AuthService } from "./auth.service.js";
import { StoreService } from "./store.service.js";

describe("admin access and CRUD", () => {
  it("creates an HttpOnly admin session and rejects a modified token", () => {
    const store = new StoreService();
    const auth = new AuthService(store);
    const result = auth.login("admin@bats.vn", "BatsAdmin2026!");
    expect(auth.verify(result.token).role).toBe("ADMIN");
    expect(auth.cookie(result.token)).toContain("HttpOnly");
    expect(() => auth.verify(`${result.token}x`)).toThrow();
  });

  it("creates, updates and soft-deletes a farm plot with audit history", async () => {
    const store = new StoreService();
    const admin = new AdminService(store);
    const plot = await admin.createPlot(
      {
        farmerId: "FARMER-0001",
        farmerName: "Nguyễn Văn Minh",
        plantingAreaCode: "VN-DLK-PA-0002",
        variety: "Monthong",
        areaHa: 1.25,
        province: "Đắk Lắk",
        district: "Krông Pắc",
        commune: "Ea Yông",
        polygon: [
          { latitude: 12.68, longitude: 108.12 },
          { latitude: 12.68, longitude: 108.13 },
          { latitude: 12.69, longitude: 108.13 }
        ]
      },
      "ADMIN-0001"
    );
    expect(plot.status).toBe("active");
    expect((await admin.updatePlot(plot.id, { areaHa: 1.5 }, "ADMIN-0001")).areaHa).toBe(1.5);
    expect((await admin.deletePlot(plot.id, "ADMIN-0001")).status).toBe("inactive");
    expect((await admin.logs()).items).toHaveLength(3);
  });
});
