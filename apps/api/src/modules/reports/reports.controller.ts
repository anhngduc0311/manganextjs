import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ReportsService } from "./reports.service";
import { CreateReportDto, ResolveReportDto } from "./dto/reports.dto";
import { JwtAuthGuard, OptionalJwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Role } from "@truyenkomi/database";

@ApiTags("Reports")
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: "Báo cáo lỗi chương truyện" })
  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  async createReport(@CurrentUser("id") userId: string | null, @Body() dto: CreateReportDto) {
    return this.reportsService.createReport(userId, dto);
  }

  @ApiOperation({ summary: "Danh sách báo lỗi chương (Admin/Moderator)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "perPage", required: false, type: Number })
  @ApiQuery({ name: "status", required: false, type: String })
  @Get("admin/list")
  async listReports(
    @Query("page") page = 1,
    @Query("perPage") perPage = 30,
    @Query("status") status?: string,
  ) {
    return this.reportsService.listReports(Number(page), Number(perPage), status);
  }

  @ApiOperation({ summary: "Xử lý báo lỗi chương (Admin/Moderator)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @Patch("admin/:id/resolve")
  async resolveReport(@Param("id") id: string, @Body() dto: ResolveReportDto) {
    return this.reportsService.resolveReport(id, dto);
  }
}
