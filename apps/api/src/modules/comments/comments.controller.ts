import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CommentsService } from "./comments.service";
import { CreateCommentDto } from "./dto/comments.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Role } from "@truyenkomi/database";

@ApiTags("Comments")
@Controller("comments")
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @ApiOperation({ summary: "Lấy danh sách bình luận của truyện hoặc chương (nested replies)" })
  @ApiQuery({ name: "comicId", required: true, type: String })
  @ApiQuery({ name: "chapterId", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "perPage", required: false, type: Number })
  @Get()
  async list(
    @Query("comicId") comicId: string,
    @Query("chapterId") chapterId?: string,
    @Query("page") page = 1,
    @Query("perPage") perPage = 20,
  ) {
    return this.commentsService.list(comicId, chapterId || null, Number(page), Number(perPage));
  }

  @ApiOperation({ summary: "Tạo bình luận mới hoặc trả lời bình luận (hỗ trợ tag [spoil])" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@CurrentUser("id") userId: string, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(userId, dto);
  }

  @ApiOperation({ summary: "Thích bình luận (Like)" })
  @Post(":id/like")
  async like(@Param("id") id: string) {
    return this.commentsService.like(id);
  }

  @ApiOperation({ summary: "Xoá bình luận (Admin / Moderator)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.commentsService.remove(id);
  }

  @ApiOperation({ summary: "Danh sách kiểm duyệt bình luận cho Admin / Moderator" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "perPage", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @Get("admin/moderation")
  async listForModeration(
    @Query("page") page = 1,
    @Query("perPage") perPage = 30,
    @Query("search") search = "",
  ) {
    return this.commentsService.listForModeration(Number(page), Number(perPage), search);
  }
}
