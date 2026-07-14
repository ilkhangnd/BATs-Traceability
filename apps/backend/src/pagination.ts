import { BadRequestException } from "@nestjs/common";

export interface PageQuery {
  page?: string;
  pageSize?: string;
  q?: string;
}

export interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PageWindow {
  page: number;
  pageSize: number;
  skip: number;
}

export function pageWindow(
  query: PageQuery,
  defaults: { pageSize?: number; maxPageSize?: number } = {}
): PageWindow {
  const page = integer(query.page, "page", 1);
  const pageSize = integer(query.pageSize, "pageSize", defaults.pageSize ?? 25);
  const maxPageSize = defaults.maxPageSize ?? 100;
  if (pageSize > maxPageSize) {
    throw new BadRequestException(`pageSize không được vượt quá ${maxPageSize}.`);
  }
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function paginate<T>(
  items: T[],
  query: PageQuery,
  defaults: { pageSize?: number; maxPageSize?: number } = {}
): PageResult<T> {
  const { page, pageSize, skip } = pageWindow(query, defaults);
  const total = items.length;
  return {
    items: items.slice(skip, skip + pageSize),
    page,
    pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize)
  };
}

export function containsText(query: string | undefined, ...values: unknown[]): boolean {
  const normalized = query?.trim().toLocaleLowerCase("vi") ?? "";
  if (!normalized) return true;
  return values.some((value) =>
    String(value ?? "")
      .toLocaleLowerCase("vi")
      .includes(normalized)
  );
}

function integer(value: string | undefined, field: string, fallback: number): number {
  if (value === undefined || value === "") return fallback;
  if (!/^\d+$/.test(value) || Number(value) < 1) {
    throw new BadRequestException(`${field} phải là số nguyên dương.`);
  }
  return Number(value);
}
