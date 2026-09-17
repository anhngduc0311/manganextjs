import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => req?.cookies?.["access_token"] || req?.cookies?.["next-auth.session-token"],
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_SECRET") || config.get<string>("AUTH_SECRET") || "truyenkomi-secret-jwt-key-2026",
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub || payload.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
        exp: true,
        level: true,
        dailyStreak: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("Người dùng không tồn tại hoặc phiên đăng nhập đã hết hạn");
    }

    return user;
  }
}
