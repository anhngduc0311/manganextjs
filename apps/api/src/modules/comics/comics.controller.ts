import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ComicsService } from "./comics.service";
import { CreateComicDto, UpdateComicDto, CreateGenreDto, UpdateGenreDto } from "./dto/comics.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";
import { ComicStatus, Role } from "@truyenkomi/database";

@ApiTags("Comics")
@Controller("comics")
export class ComicsController {
  constructor(private readonly comicsService: ComicsService) {}

  @ApiOperation({ summary: "Lấy danh sách truyện Hot và Mới cập nhật cho trang chủ" })
  @Get("home-feed")
  async getHomeFeed() {
    return this.comicsService.getHomeFeed();
  }

  @ApiOperation({ summary: "Lấy bảng xếp hạng truyện (daily / weekly / monthly)" })
  @ApiQuery({ name: "period", enum: ["daily", "weekly", "monthly"], required: false })
  @Get("ranking")
  async getRankings(@Query("period") period: "daily" | "weekly" | "monthly" = "daily") {
    return this.comicsService.getRankings(period);
  }

  @ApiOperation({ summary: "Lấy toàn bộ danh sách thể loại truyện" })
  @Get("genres")
  async listCategories() {
    return this.comicsService.listCategories();
  }

  @ApiOperation({ summary: "Lấy danh sách truyện theo bộ lọc (thể loại, trạng thái, sắp xếp, phân trang)" })
  @ApiQuery({ name: "genres", required: false, type: [String], isArray: true })
  @ApiQuery({ name: "status", required: false, enum: ["ONGOING", "COMPLETED", "DROPPED"] })
  @ApiQuery({ name: "sort", required: false, enum: ["views", "rating", "updated", "new"] })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "perPage", required: false, type: Number })
  @Get()
  async listComics(
    @Query("genres") genres?: string | string[],
    @Query("status") status?: ComicStatus,
    @Query("sort") sort?: "views" | "rating" | "updated" | "new",
    @Query("page") page = 1,
    @Query("perPage") perPage = 24,
  ) {
    const genreList = Array.isArray(genres) ? genres : genres ? [genres] : [];
    return this.comicsService.listComics({
      genres: genreList,
      status,
      sort,
      page: Number(page),
      perPage: Number(perPage),
    });
  }

  @ApiOperation({ summary: "Lấy thông tin chi tiết của một bộ truyện bằng slug" })
  @Get(":slug")
  async getBySlug(@Param("slug") slug: string) {
    return this.comicsService.getBySlug(slug);
  }

  // --- ADMIN / MODERATOR ENDPOINTS ---
  @ApiOperation({ summary: "Tạo truyện mới (Admin/Moderator)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @Post()
  async createComic(@Body() dto: CreateComicDto) {
    return this.comicsService.createComic(dto);
  }

  @ApiOperation({ summary: "Cập nhật truyện (Admin/Moderator)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @Put(":id")
  async updateComic(@Param("id") id: string, @Body() dto: UpdateComicDto) {
    return this.comicsService.updateComic(id, dto);
  }

  @ApiOperation({ summary: "Xoá truyện (Admin)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(":id")
  async deleteComic(@Param("id") id: string) {
    return this.comicsService.deleteComic(id);
  }

  @ApiOperation({ summary: "Tạo thể loại mới (Admin/Moderator)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @Post("genres")
  async createCategory(@Body() dto: CreateGenreDto) {
    return this.comicsService.createCategory(dto);
  }

  @ApiOperation({ summary: "Cập nhật thể loại (Admin/Moderator)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @Put("genres/:id")
  async updateCategory(@Param("id") id: string, @Body() dto: UpdateGenreDto) {
    return this.comicsService.updateCategory(id, dto);
  }

  @ApiOperation({ summary: "Xoá thể loại (Admin)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete("genres/:id")
  async deleteCategory(@Param("id") id: string) {
    return this.comicsService.deleteCategory(id);
  }
}
