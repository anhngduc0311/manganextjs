import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { SearchService } from "./search.service";

@ApiTags("Search")
@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @ApiOperation({ summary: "Tìm kiếm truyện tiếng Việt không dấu (Meilisearch / Postgres Trigram)" })
  @ApiQuery({ name: "q", required: true, type: String })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  @Get()
  async search(
    @Query("q") query = "",
    @Query("limit") limit = 24,
    @Query("offset") offset = 0,
  ) {
    return this.searchService.searchComics(query, Number(limit), Number(offset));
  }

  @ApiOperation({ summary: "Gợi ý nhanh cho thanh tìm kiếm (Autocomplete)" })
  @ApiQuery({ name: "q", required: true, type: String })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @Get("suggest")
  async suggest(@Query("q") query = "", @Query("limit") limit = 5) {
    return this.searchService.quickSuggest(query, Number(limit));
  }
}
