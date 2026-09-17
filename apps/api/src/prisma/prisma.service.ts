import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient, getPrismaAdapter } from "@truyenkomi/database";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      adapter: getPrismaAdapter(),
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log("Prisma connected successfully to PostgreSQL via pg Driver Adapter");
    } catch (error) {
      this.logger.error("Failed to connect to PostgreSQL via Prisma", error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log("Prisma Disconnected from PostgreSQL");
  }
}
