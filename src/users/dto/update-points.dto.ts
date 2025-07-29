import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePointsDto {
  @ApiProperty({
    description: 'Aptos blockchain wallet address',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  aptos_address: string;

  @ApiProperty({
    description: 'Number of points to add/subtract (minimum 1)',
    example: 10,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  points: number;
}
