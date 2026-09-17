import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ComicStatus } from "@truyenkomi/database";

export class IngestComicDto {
  @ApiProperty({ example: "Solo Leveling" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: "solo-leveling" })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: "Chugong" })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ enum: ["ONGOING", "COMPLETED", "DROPPED"] })
  @IsOptional()
  @IsEnum(["ONGOING", "COMPLETED", "DROPPED"])
  status?: ComicStatus;

  @ApiPropertyOptional({ example: "Mô tả truyện..." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "Tôi Thăng Cấp Một Mình" })
  @IsOptional()
  @IsString()
  otherNames?: string;

  @ApiPropertyOptional({ example: "https://example.com/cover.webp" })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ example: ["Action", "Fantasy"] })
  @IsOptional()
  @IsArray()
  categories?: string[];
}

export class IngestChapterDto {
  @ApiProperty({ example: 1.0 })
  @IsNumber()
  @IsPositive()
  chapterNumber: number;

  @ApiPropertyOptional({ example: "Chương 1: Khởi đầu" })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: ["https://example.com/p1.webp", "https://example.com/p2.webp"] })
  @IsArray()
  pages: string[];
}

export class IngestPayloadDto {
  @ApiProperty({ type: IngestComicDto })
  @ValidateNested()
  @Type(() => IngestComicDto)
  comic: IngestComicDto;

  @ApiProperty({ type: [IngestChapterDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngestChapterDto)
  chapters: IngestChapterDto[];
}
