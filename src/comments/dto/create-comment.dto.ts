import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Aptos blockchain wallet address of the comment author',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  aptos_address: string;

  @ApiProperty({
    description: 'Content of the comment',
    example: 'This is a great post!',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
