import { IsEmpty, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateUserDTO {
  @IsNumber()
  @IsNotEmpty()
  readonly id: number;

  @IsString()
  readonly name: string;

  @IsString()
  @IsEmpty()
  readonly username: string;

  @IsNotEmpty()
  @IsString()
  readonly aptos_wallet_address: string;
}
