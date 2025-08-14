import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiProperty({
    description:
      'Aptos blockchain wallet address of the user updating the post',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  aptos_address: string;

  @ApiProperty({
    description: 'Content of the post',
    example: 'This is my updated post!',
    required: false,
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({
    description: 'Indicates if the post is a blink',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  has_blink?: boolean;

  @ApiProperty({
    description: 'Collection URI for the post, if any',
    example: 'https://example.com/collection/456',
    required: false,
  })
  @IsString()
  @IsOptional()
  collection_uri?: string;
}
