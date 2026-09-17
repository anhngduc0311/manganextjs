import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { ComicStatus } from "@truyenkomi/database";

export class CreateComicDto {
  @ApiProperty({ example: "Solo Leveling" })
  @IsString()
  @IsNotEmpty({ message: "Tên truyện không được trống" })
  title: string;

  @ApiPropertyOptional({ example: "solo-leveling" })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: "Tôi Thăng Cấp Một Mình" })
  @IsOptional()
  @IsString()
  otherNames?: string;

  @ApiPropertyOptional({ example: "Chugong" })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ enum: ["ONGOING", "COMPLETED", "DROPPED"], default: "ONGOING" })
  @IsOptional()
  @IsEnum(["ONGOING", "COMPLETED", "DROPPED"])
  status?: ComicStatus;

  @ApiProperty({ example: "https://example.com/cover.webp" })
  @IsString()
  @IsNotEmpty({ message: "Ảnh bìa không được trống" })
  coverImage: string;

  @ApiPropertyOptional({ example: "https://example.com/banner.webp" })
  @IsOptional()
  @IsString()
  bannerImage?: string;

  @ApiPropertyOptional({ example: "Mô tả truyện..." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: ["uuid-category-1", "uuid-category-2"] })
  @IsOptional()
  @IsArray()
  categoryIds?: string[];
}

export class UpdateComicDto extends CreateComicDto {}

export class CreateGenreDto {
  @ApiProperty({ example: "Hành Động" })
  @IsString()
  @IsNotEmpty({ message: "Tên thể loại không được trống" })
  name: string;

  @ApiPropertyOptional({ example: "hanh-dong" })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: "Thể loại hành động lôi cuốn" })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateGenreDto extends CreateGenreDto {}
