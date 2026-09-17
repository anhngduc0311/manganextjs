import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto, RefreshTokenDto } from "./dto/auth.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: "Đăng ký tài khoản mới" })
  @ApiResponse({ status: 201, description: "Đăng ký thành công, trả về Access Token và User" })
  @Post("register")
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: "Đăng nhập hệ thống" })
  @ApiResponse({ status: 200, description: "Đăng nhập thành công, trả về Access Token và User" })
  @Post("login")
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: "Làm mới Access Token bằng Refresh Token" })
  @ApiResponse({ status: 200, description: "Cấp mới Access Token" })
  @Post("refresh")
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @ApiOperation({ summary: "Lấy thông tin tài khoản hiện tại" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getMe(@CurrentUser("id") userId: string) {
    return this.authService.getMe(userId);
  }

  @ApiOperation({ summary: "Đăng xuất tài khoản" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("logout")
  async logout(@CurrentUser("id") userId: string) {
    return this.authService.logout(userId);
  }
}
