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

  it("marks a GPS plot created during mobile farmer registration as pending review", async () => {
    const store = new StoreService();
    const auth = new AuthService(store);
    const result = await auth.registerFarmer({
      phone: "0909000001",
      name: "Nông hộ thử nghiệm",
      latitude: 12.7,
      longitude: 108.1,
      plotId: "plot-rnd-review-001"
    });
    expect(store.plots.get("plot-rnd-review-001")).toMatchObject({
      farmerId: result.actor.id,
      status: "pending"
    });
    expect(store.listPlots().some((plot) => plot.id === "plot-rnd-review-001")).toBe(false);
  });

  it("registers and signs in a cooperative with a scoped actor token", async () => {
    const store = new StoreService();
    const auth = new AuthService(store);
    const registered = await auth.registerCooperative({
      phone: "0909000002",
      name: "HTX Thử nghiệm",
      organization: "HTX BATS"
    });
    const signedIn = await auth.loginCooperative("0909000002");
    expect(registered.actor.role).toBe("COOPERATIVE");
    expect(auth.verify(signedIn.accessToken).id).toBe(registered.actor.id);
  });
});
