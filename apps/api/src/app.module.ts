import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ComicsModule } from "./modules/comics/comics.module";
import { ChaptersModule } from "./modules/chapters/chapters.module";
import { CommentsModule } from "./modules/comments/comments.module";
import { RatingsModule } from "./modules/ratings/ratings.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { SearchModule } from "./modules/search/search.module";
import { ViewsModule } from "./modules/views/views.module";
import { StorageModule } from "./modules/storage/storage.module";
import { CrawlerModule } from "./modules/crawler/crawler.module";
import { RealtimeModule } from "./modules/realtime/realtime.module";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env", "../../.env.local", "../../.env"],
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    ComicsModule,
    ChaptersModule,
    CommentsModule,
    RatingsModule,
    ReportsModule,
    NotificationsModule,
    SearchModule,
    ViewsModule,
    StorageModule,
    CrawlerModule,
    RealtimeModule,
    HealthModule,
  ],
})
export class AppModule {}
