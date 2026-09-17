import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";
import { randomBytes, randomUUID } from "crypto";
import { PrismaService } from "@/prisma/prisma.service";
import { computeStreak, DAILY_STREAK_BONUS } from "@/common/utils/leveling";
import { RegisterDto, LoginDto } from "./dto/auth.dto";

const REFRESH_TOKEN_TTL_DAYS = 30;

const safeUserSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
  avatar: true,
  exp: true,
  level: true,
  dailyStreak: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return argonHash(password);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return argonVerify(hash, password);
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: dto.username },
          { email: dto.email.toLowerCase() },
        ],
      },
    });

    if (existing) {
      if (existing.email.toLowerCase() === dto.email.toLowerCase()) {
        throw new ConflictException("Email này đã được sử dụng");
      }
      throw new ConflictException("Tên đăng nhập này đã được sử dụng");
    }

    const passwordHash = await this.hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email.toLowerCase(),
        passwordHash,
      },
      select: safeUserSelect,
    });

    const refreshToken = await this.issueRefreshToken(user.id);
    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async login(dto: LoginDto) {
    const ident = dto.identifier.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: ident },
          { username: dto.identifier.trim() },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException("Tài khoản hoặc mật khẩu không chính xác");
    }

    const isValid = await this.verifyPassword(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException("Tài khoản hoặc mật khẩu không chính xác");
    }

    // Touch streak
    await this.touchDailyStreak(user.id, user.lastActiveAt, user.dailyStreak);

    const updatedUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: safeUserSelect,
    });

    const refreshToken = await this.issueRefreshToken(user.id);
    const accessToken = this.generateAccessToken(updatedUser!);

    return {
      accessToken,
      refreshToken,
      user: updatedUser,
    };
  }

  async refreshToken(token: string) {
    if (!token) {
      throw new BadRequestException("Refresh token không hợp lệ");
    }

    const user = await this.prisma.user.findFirst({
      where: {
        refreshToken: token,
        refreshExpiry: { gt: new Date() },
      },
      select: safeUserSelect,
    });

    if (!user) {
      throw new UnauthorizedException("Refresh token không hợp lệ hoặc đã hết hạn");
    }

    const newRefreshToken = await this.issueRefreshToken(user.id);
    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: safeUserSelect,
    });
    if (!user) {
      throw new UnauthorizedException("Người dùng không tồn tại");
    }
    return user;
  }

  async logout(userId: string) {
    await this.prisma.user.updateMany({
      where: { id: userId },
      data: { refreshToken: null, refreshExpiry: null },
    });
    return { success: true };
  }

  generateAccessToken(user: any): string {
    const payload = {
      sub: user.id,
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  private async issueRefreshToken(userId: string): Promise<string> {
    const token = `${randomUUID()}.${randomBytes(24).toString("hex")}`;
    const refreshExpiry = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: token, refreshExpiry },
    });
    return token;
  }

  private async touchDailyStreak(userId: string, lastActiveAt: Date, currentStreak: number) {
    const result = computeStreak(lastActiveAt, currentStreak);
    await this.prisma.user.update({
      where: { id: userId },
      data: { dailyStreak: result.streak, lastActiveAt: new Date() },
    });

    if (result.awarded) {
      await this.prisma.$transaction(async (tx) => {
        const u = await tx.user.update({
          where: { id: userId },
          data: { exp: { increment: DAILY_STREAK_BONUS } },
          select: { exp: true },
        });
        const newLevel = Math.floor(Math.sqrt(Math.max(u.exp, 0) / 100)) + 1;
        await tx.user.update({
          where: { id: userId },
          data: { level: newLevel },
        });
      });
    }
  }
}
