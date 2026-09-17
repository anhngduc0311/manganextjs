import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateCommentDto {
  @ApiProperty({ example: "uuid-comic-id" })
  @IsUUID()
  @IsNotEmpty()
  comicId: string;

  @ApiPropertyOptional({ example: "uuid-chapter-id" })
  @IsOptional()
  @IsUUID()
  chapterId?: string;

  @ApiPropertyOptional({ example: "uuid-parent-comment-id" })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ example: "Truyện đọc cuốn quá! [spoil] tình tiết bí mật [/spoil]" })
  @IsString()
  @MinLength(1, { message: "Bình luận không được trống" })
  @MaxLength(2000, { message: "Bình luận tối đa 2000 ký tự" })
  content: string;
}
