import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Length, Matches } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "demouser" })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_]{3,30}$/, {
    message: "Username chỉ gồm chữ, số, dấu gạch dưới (3-30 ký tự)",
  })
  username: string;

  @ApiProperty({ example: "user@example.com" })
  @IsEmail({}, { message: "Email không hợp lệ" })
  email: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  @Length(8, 72, { message: "Mật khẩu tối thiểu 8 ký tự và tối đa 72 ký tự" })
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: "demouser hoặc user@example.com" })
  @IsString()
  @IsNotEmpty({ message: "Vui lòng nhập email hoặc username" })
  identifier: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  @IsNotEmpty({ message: "Vui lòng nhập mật khẩu" })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: "token-string" })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
