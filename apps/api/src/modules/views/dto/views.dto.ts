import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

export class RecordViewDto {
  @ApiProperty({ example: "uuid-comic-id" })
  @IsUUID()
  @IsNotEmpty()
  comicId: string;

  @ApiProperty({ example: "uuid-chapter-id" })
  @IsUUID()
  @IsNotEmpty()
  chapterId: string;
}
