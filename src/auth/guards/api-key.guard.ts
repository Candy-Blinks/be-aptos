import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey =
      request.headers['cb-api-key'] || request.headers['CB-API-KEY'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const validApiKey = this.configService.get<string>('API_KEY');
    const validDevApiKey = this.configService.get<string>('API_KEY_DEV');
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    // In development, allow both dev and production keys
    if (nodeEnv === 'development') {
      if (apiKey === validApiKey || apiKey === validDevApiKey) {
        return true;
      }
    } else {
      // In production, only allow production key
      if (apiKey === validApiKey) {
        return true;
      }
    }

    throw new UnauthorizedException('Invalid API key');
  }
}
