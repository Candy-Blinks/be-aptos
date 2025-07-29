import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  aptos_address: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Aptos address and password' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        aptos_address: {
          type: 'string',
          description: 'Aptos blockchain wallet address',
          example:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
        password: {
          type: 'string',
          description: 'Admin password',
          example: 'admin123',
        },
      },
      required: ['aptos_address', 'password'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'clx1234567890',
          username: 'johndoe',
          aptos_address:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          display_name: 'John Doe',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.aptos_address, loginDto.password);
  }
}
