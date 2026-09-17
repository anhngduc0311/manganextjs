import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { StorageService } from "./storage.service";
import { GetUploadUrlDto } from "./dto/storage.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";
import { Role } from "@truyenkomi/database";

@ApiTags("Storage")
@Controller("upload")
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @ApiOperation({ summary: "Tạo Pre-signed URL để upload ảnh trực tiếp lên Cloudflare R2 / S3" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @Post("presign")
  async getPresignedUrl(@Body() dto: GetUploadUrlDto) {
    return this.storageService.getPresignedPutUrl(dto.filename, dto.contentType);
  }
}
