import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FollowUserDto {
  @ApiProperty({
    description:
      'Aptos address of the user who is performing the follow action',
    example: '0x123...',
  })
  @IsString()
  @IsNotEmpty()
  follower_aptos_address: string;

  @ApiProperty({
    description: 'Aptos address of the user to be followed',
    example: '0x456...',
  })
  @IsString()
  @IsNotEmpty()
  following_aptos_address: string;
}
