import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsUUID, Max, Min } from "class-validator";

export class RateComicDto {
  @ApiProperty({ example: "uuid-comic-id" })
  @IsUUID()
  @IsNotEmpty()
  comicId: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1, { message: "Điểm đánh giá tối thiểu là 1" })
  @Max(5, { message: "Điểm đánh giá tối đa là 5" })
  score: number;
}
