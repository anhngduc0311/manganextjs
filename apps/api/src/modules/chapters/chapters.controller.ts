import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ChaptersService } from "./chapters.service";
import { UpsertChapterDto } from "./dto/chapters.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";
import { Role } from "@truyenkomi/database";

@ApiTags("Chapters")
@Controller("chapters")
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @ApiOperation({ summary: "Lấy dữ liệu trang đọc (pages, prev/next chapter) cho độc giả" })
  @Get("reader/:comicSlug/:chapterNumber")
  async getReaderData(
    @Param("comicSlug") comicSlug: string,
    @Param("chapterNumber") chapterNumber: string,
  ) {
    return this.chaptersService.getReaderData(comicSlug, Number(chapterNumber));
  }

  @ApiOperation({ summary: "Lấy danh sách các chương của một bộ truyện bằng comicId" })
  @Get("comic/:comicId")
  async listChaptersByComicId(@Param("comicId") comicId: string) {
    return this.chaptersService.listChaptersByComicId(comicId);
  }

  @ApiOperation({ summary: "Lấy danh sách quản lý chương cho Admin bằng comicId" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @Get("admin/comic/:comicId")
  async listChaptersAdmin(@Param("comicId") comicId: string) {
    return this.chaptersService.listChaptersAdmin(comicId);
  }

  @ApiOperation({ summary: "Tạo hoặc cập nhật chương truyện (Admin/Moderator)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @Post()
  async upsertChapter(@Body() dto: UpsertChapterDto) {
    return this.chaptersService.upsertChapter(dto);
  }

  @ApiOperation({ summary: "Xoá chương truyện (Admin/Moderator)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @Delete(":id")
  async deleteChapter(@Param("id") id: string) {
    return this.chaptersService.deleteChapter(id);
  }
}
