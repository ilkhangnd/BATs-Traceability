import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { containsText, paginate } from "./pagination.js";

describe("pagination", () => {
  it("returns deterministic page metadata", () => {
    expect(paginate([1, 2, 3, 4, 5], { page: "2", pageSize: "2" })).toEqual({
      items: [3, 4],
      page: 2,
      pageSize: 2,
      total: 5,
      totalPages: 3
    });
  });

  it("rejects invalid and oversized pages", () => {
    expect(() => paginate([], { page: "0" })).toThrow(BadRequestException);
    expect(() => paginate([], { pageSize: "101" })).toThrow(BadRequestException);
  });

  it("searches text case-insensitively across fields", () => {
    expect(containsText("ea yông", "Đắk Lắk", "Ea Yông")).toBe(true);
    expect(containsText("ri6", "Monthong")).toBe(false);
  });
});
