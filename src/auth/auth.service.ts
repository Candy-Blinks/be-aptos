import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(aptosAddress: string, password: string) {
    // For now, use a placeholder password check
    // TODO: Replace with Aptos wallet signature verification
    const expectedPassword =
      this.configService.get<string>('ADMIN_PASSWORD') || 'admin123';

    if (password !== expectedPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { aptos_address: aptosAddress },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate JWT token
    const payload = {
      aptosAddress: user.aptos_address,
      username: user.username,
      sub: user.id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        aptos_address: user.aptos_address,
        display_name: user.display_name,
      },
    };
  }

  validateApiKey(apiKey: string): boolean {
    const validApiKey = this.configService.get<string>('API_KEY');
    const validDevApiKey = this.configService.get<string>('API_KEY_DEV');
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    if (nodeEnv === 'development') {
      return apiKey === validApiKey || apiKey === validDevApiKey;
    }

    return apiKey === validApiKey;
  }
} 