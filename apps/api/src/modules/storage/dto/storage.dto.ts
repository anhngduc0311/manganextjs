import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";

export class GetUploadUrlDto {
  @ApiProperty({ example: "cover.jpg" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  filename: string;

  @ApiProperty({ example: "image/jpeg" })
  @IsString()
  @Matches(/^image\/(png|jpe?g|webp|gif|avif)$/, {
    message: "Chỉ hỗ trợ định dạng file ảnh (png, jpg, webp, gif, avif)",
  })
  contentType: string;
}
