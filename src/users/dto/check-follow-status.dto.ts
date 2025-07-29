import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckFollowStatusDto {
  @ApiProperty({
    description: 'Aptos address of the user who might be following',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  follower_aptos_address: string;

  @ApiProperty({
    description: 'Aptos address of the user who might be followed',
    example:
      '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
  })
  @IsString()
  @IsNotEmpty()
  following_aptos_address: string;
}
