import { Controller, Get, Patch, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

@ApiTags("Notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: "Lấy danh sách thông báo gần đây của người dùng" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: "limit", required: false, type: Number })
  @Get()
  async listRecent(@CurrentUser("id") userId: string, @Query("limit") limit = 10) {
    return this.notificationsService.listRecent(userId, Number(limit));
  }

  @ApiOperation({ summary: "Đếm số lượng thông báo chưa đọc" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("unread-count")
  async countUnread(@CurrentUser("id") userId: string) {
    return this.notificationsService.countUnread(userId);
  }

  @ApiOperation({ summary: "Đánh dấu 1 thông báo là đã đọc" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(":id/read")
  async markRead(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.notificationsService.markRead(userId, id);
  }

  @ApiOperation({ summary: "Đánh dấu tất cả thông báo là đã đọc" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch("read-all")
  async markAllRead(@CurrentUser("id") userId: string) {
    return this.notificationsService.markAllRead(userId);
  }
}
