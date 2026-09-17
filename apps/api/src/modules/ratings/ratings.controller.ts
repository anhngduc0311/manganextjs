import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { RatingsService } from "./ratings.service";
import { RateComicDto } from "./dto/ratings.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

@ApiTags("Ratings")
@Controller("ratings")
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @ApiOperation({ summary: "Đánh giá điểm cho truyện (1-5 sao)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  async rateComic(@CurrentUser("id") userId: string, @Body() dto: RateComicDto) {
    return this.ratingsService.rateComic(userId, dto);
  }

  @ApiOperation({ summary: "Lấy điểm đánh giá của người dùng cho truyện" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(":comicId/me")
  async getUserRating(@CurrentUser("id") userId: string, @Param("comicId") comicId: string) {
    return this.ratingsService.getUserRating(userId, comicId);
  }
}
