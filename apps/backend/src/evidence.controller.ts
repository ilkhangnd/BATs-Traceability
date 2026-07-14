import {
  Controller,
  Inject,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AccessGuard, type ActorRequest, Roles } from "./access.guard.js";
import { EvidenceService, type UploadedEvidenceFile } from "./evidence.service.js";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";

@Controller("evidence")
@UseGuards(AccessGuard)
@ApiTags("Evidence")
@ApiBearerAuth("actor-token")
export class EvidenceController {
  constructor(@Inject(EvidenceService) private readonly evidence: EvidenceService) {}

  @Post("upload")
  @ApiOperation({ summary: "Upload evidence, kiểm tra MIME/signature và tính SHA-256" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["file"],
      properties: { file: { type: "string", format: "binary" } }
    }
  })
  @Roles("FARMER", "COLLECTOR", "COOPERATIVE", "PACKING", "EXPORTER", "ADMIN")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  upload(
    @UploadedFile() file: UploadedEvidenceFile | undefined,
    @Req() request: ActorRequest
  ) {
    return this.evidence.upload(file, request.actor!.id);
  }
}
