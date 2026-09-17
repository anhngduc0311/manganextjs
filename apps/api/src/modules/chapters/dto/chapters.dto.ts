import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class PageItemDto {
  @ApiProperty({ example: 0 })
  @IsInt()
  pageIndex: number;

  @ApiProperty({ example: "https://example.com/page-0.webp" })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;
}

export class UpsertChapterDto {
  @ApiPropertyOptional({ example: "uuid-chapter-id" })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: "uuid-comic-id" })
  @IsUUID()
  @IsNotEmpty()
  comicId: string;

  @ApiProperty({ example: 1.0 })
  @IsNumber()
  @IsPositive({ message: "Số chương phải lớn hơn 0" })
  chapterNumber: number;

  @ApiPropertyOptional({ example: "Chương 1: Khởi đầu" })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ type: [PageItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PageItemDto)
  pages: PageItemDto[];
}
