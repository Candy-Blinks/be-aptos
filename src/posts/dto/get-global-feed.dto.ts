import { IsOptional, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetGlobalFeedDto {
  @ApiProperty({
    description: 'Number of posts to return (default: 20)',
    example: 20,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  take?: number = 20;

  @ApiProperty({
    description: 'Number of posts to skip (default: 0)',
    example: 0,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(0)
  skip?: number = 0;
}
