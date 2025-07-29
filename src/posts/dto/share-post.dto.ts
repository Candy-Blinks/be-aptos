import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SharePostDto {
  @ApiProperty({
    description: 'Aptos address of the user sharing the post',
    example: '0x123...',
  })
  @IsString()
  @IsNotEmpty()
  aptos_address: string;

  @ApiProperty({
    description: 'Optional content to add to the shared post',
    example: 'Check this out!',
    required: false,
  })
  @IsString()
  @IsOptional()
  content?: string;
}
