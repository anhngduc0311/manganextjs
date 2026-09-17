import { Body, Controller, Headers, Post, UnauthorizedException } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { CrawlerService } from "./crawler.service";
import { IngestPayloadDto } from "./dto/crawler.dto";

@ApiTags("Crawler")
@Controller("crawler")
export class CrawlerController {
  constructor(
    private readonly crawlerService: CrawlerService,
    private readonly config: ConfigService,
  ) {}

  @ApiOperation({ summary: "Endpoint Ingestion nhận dữ liệu truyện và chương từ MangaDex Crawler" })
  @ApiHeader({ name: "Authorization", description: "Bearer <CRAWLER_SECRET_KEY>", required: true })
  @Post("ingest")
  async ingest(
    @Headers("authorization") authHeader: string,
    @Body() payload: IngestPayloadDto,
  ) {
    const secret = this.config.get<string>("CRAWLER_SECRET_KEY") || "dev-crawler-secret";
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Thiếu Bearer Token ủy quyền");
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (token !== secret) {
      throw new UnauthorizedException("Secret key không hợp lệ");
    }

    return this.crawlerService.ingest(payload);
  }
}
