import { IsNotEmpty, IsString, MinLength, IsOptional, IsObject } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @IsString()
  @IsNotEmpty()
  aptos_address: string;

  @IsString()
  @IsNotEmpty()
  display_name: string;

  @IsString()
  @IsOptional()
  header_url?: string;

  @IsString()
  @IsOptional()
  profile_url?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsObject()
  @IsOptional()
  socials?: {
    website?: string;
    x?: string;
    tiktok?: string;
    linkedin?: string;
    youtube?: string;
    instagram?: string;
    facebook?: string;
  };
} 