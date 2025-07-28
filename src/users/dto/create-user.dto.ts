import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEmail,
} from 'class-validator';

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

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  profile_url?: string;

  @IsString()
  @IsOptional()
  referral_code?: string; // The referral code of the person who referred this user
}
