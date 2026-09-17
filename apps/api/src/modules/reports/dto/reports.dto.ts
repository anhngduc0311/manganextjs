import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString, IsUUID, Length } from "class-validator";

export class CreateReportDto {
  @ApiProperty({ example: "uuid-chapter-id" })
  @IsUUID()
  @IsNotEmpty()
  chapterId: string;

  @ApiProperty({ example: "Ảnh chương bị lỗi / trùng trang" })
  @IsString()
  @Length(5, 500, { message: "Lý do báo lỗi tối thiểu 5 ký tự và tối đa 500 ký tự" })
  reason: string;
}

export class ResolveReportDto {
  @ApiProperty({ enum: ["RESOLVED", "REJECTED"] })
  @IsEnum(["RESOLVED", "REJECTED"])
  status: "RESOLVED" | "REJECTED";
}
