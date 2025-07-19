import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';

export class UpdatePointsDto {
  @IsString()
  @IsNotEmpty()
  aptos_address: string;

  @IsNumber()
  @Min(1)
  points: number;
} 