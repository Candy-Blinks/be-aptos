import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  aptos_address: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  files?: Express.Multer.File[];
}
