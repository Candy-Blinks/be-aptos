import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyStrategy {
  constructor(private configService: ConfigService) {}

  validate(token: string): boolean {
    const validApiKey = this.configService.get<string>('API_KEY');
    const validDevApiKey = this.configService.get<string>('API_KEY_DEV');
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    // In development, allow both dev and production keys
    if (nodeEnv === 'development') {
      return token === validApiKey || token === validDevApiKey;
    }

    // In production, only allow production key
    return token === validApiKey;
  }
}
