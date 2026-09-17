import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { Role } from "@truyenkomi/database";

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: "https://example.com/avatar.jpg" })
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class RecordHistoryDto {
  @ApiProperty({ example: "uuid-comic-id" })
  @IsUUID()
  @IsNotEmpty()
  comicId: string;

  @ApiProperty({ example: "uuid-chapter-id" })
  @IsUUID()
  @IsNotEmpty()
  chapterId: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  lastReadPage: number;
}

export class UpdateRoleDto {
  @ApiProperty({ enum: ["USER", "MODERATOR", "ADMIN"] })
  @IsEnum(["USER", "MODERATOR", "ADMIN"])
  role: Role;
}
