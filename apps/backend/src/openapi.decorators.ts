import { applyDecorators } from "@nestjs/common";
import { ApiQuery } from "@nestjs/swagger";

export function ApiPagination() {
  return applyDecorators(
    ApiQuery({ name: "page", required: false, type: Number, example: 1 }),
    ApiQuery({
      name: "pageSize",
      required: false,
      type: Number,
      example: 25,
      description: "Số phần tử mỗi trang, tối đa 100."
    }),
    ApiQuery({ name: "q", required: false, type: String, description: "Từ khóa tìm kiếm." })
  );
}
