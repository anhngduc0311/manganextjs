import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ViewsService } from "./views.service";
import { RecordViewDto } from "./dto/views.dto";

@ApiTags("Views")
@Controller("views")
export class ViewsController {
  constructor(private readonly viewsService: ViewsService) {}

  @ApiOperation({ summary: "Ghi nhận lượt xem truyện & chương" })
  @Post()
  async recordView(@Body() dto: RecordViewDto) {
    return this.viewsService.recordView(dto);
  }
}
