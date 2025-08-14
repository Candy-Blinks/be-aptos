import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    description: 'Aptos blockchain wallet address of the post author',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  aptos_address: string;

  @ApiProperty({
    description: 'Content of the post',
    example: 'This is my first post!',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'Indicates if the post is a blink',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  has_blink?: boolean;

  @ApiProperty({
    description: 'Collection URI for the post, if any',
    example: 'https://example.com/collection/123',
    required: false,
  })
  @IsString()
  @IsOptional()
  collection_uri?: string;

  @ApiProperty({
    description: 'Optional files to upload with the post',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    required: false,
  })
  @IsOptional()
  files?: Express.Multer.File[];
}
