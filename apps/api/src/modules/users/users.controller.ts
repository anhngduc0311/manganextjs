import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { UpdateProfileDto, RecordHistoryDto, UpdateRoleDto } from "./dto/users.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Role } from "@truyenkomi/database";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: "Lấy thông tin hồ sơ của chính mình (EXP, Level, Streak)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("profile")
  async getMyProfile(@CurrentUser("id") userId: string) {
    return this.usersService.getProfile(userId);
  }

  @ApiOperation({ summary: "Cập nhật thông tin hồ sơ (avatar)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch("profile")
  async updateProfile(@CurrentUser("id") userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @ApiOperation({ summary: "Lấy danh sách truyện đang theo dõi" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "perPage", required: false, type: Number })
  @Get("follows")
  async getFollows(
    @CurrentUser("id") userId: string,
    @Query("page") page = 1,
    @Query("perPage") perPage = 20,
  ) {
    return this.usersService.getFollows(userId, Number(page), Number(perPage));
  }

  @ApiOperation({ summary: "Bật / Tắt theo dõi một bộ truyện" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("follows/:comicId")
  async toggleFollow(@CurrentUser("id") userId: string, @Param("comicId") comicId: string) {
    return this.usersService.toggleFollow(userId, comicId);
  }

  @ApiOperation({ summary: "Kiểm tra xem user đã theo dõi bộ truyện hay chưa" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("follows/:comicId/status")
  async isFollowing(@CurrentUser("id") userId: string, @Param("comicId") comicId: string) {
    return this.usersService.isFollowing(userId, comicId);
  }

  @ApiOperation({ summary: "Lấy lịch sử đọc truyện của người dùng" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "perPage", required: false, type: Number })
  @Get("history")
  async getHistory(
    @CurrentUser("id") userId: string,
    @Query("page") page = 1,
    @Query("perPage") perPage = 20,
  ) {
    return this.usersService.getHistory(userId, Number(page), Number(perPage));
  }

  @ApiOperation({ summary: "Ghi nhận lịch sử đọc truyện & nhận EXP thưởng" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("history")
  async recordHistory(@CurrentUser("id") userId: string, @Body() dto: RecordHistoryDto) {
    return this.usersService.recordHistory(userId, dto);
  }

  // --- ADMIN ENDPOINTS ---
  @ApiOperation({ summary: "Quản lý danh sách người dùng (Admin/Moderator)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "perPage", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "role", required: false, enum: ["USER", "MODERATOR", "ADMIN"] })
  @Get("admin/list")
  async listUsersAdmin(
    @Query("page") page = 1,
    @Query("perPage") perPage = 20,
    @Query("search") search = "",
    @Query("role") role?: Role,
  ) {
    return this.usersService.listUsersAdmin(Number(page), Number(perPage), search, role);
  }

  @ApiOperation({ summary: "Phân quyền người dùng (Chỉ ADMIN)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch("admin/:userId/role")
  async updateUserRole(
    @CurrentUser("id") adminUserId: string,
    @Param("userId") targetUserId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.usersService.updateUserRole(adminUserId, targetUserId, dto.role);
  }
}
