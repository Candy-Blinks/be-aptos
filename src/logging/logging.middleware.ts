import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggingService } from './logging.service';

interface ExtendedRequest extends Request {
  user?: {
    userId?: string;
    username?: string;
    aptosAddress?: string;
  };
}

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private loggingService: LoggingService) {}

  use(req: ExtendedRequest, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const originalJson = res.json;
    let responseBody: any;

    // Capture response body
    res.json = function (body: any) {
      responseBody = body;
      return originalJson.call(this, body);
    };

    // Log after response is sent
    res.on('finish', async () => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Extract user info if available
      const userInfo = req.user || {};

      // Get IP address
      const ipAddress = 
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        'unknown';

      // Prepare request body (sanitize sensitive data)
      const requestBody = req.body ? this.sanitizeRequestBody(req.body) : null;

      // Prepare response body (limit size and sanitize)
      const sanitizedResponseBody = responseBody
        ? this.sanitizeResponseBody(responseBody)
        : null;

      try {
        await this.loggingService.logAccess({
          userId: userInfo.userId,
          username: userInfo.username,
          aptosAddress: userInfo.aptosAddress,
          ipAddress,
          endpoint: req.originalUrl || req.url,
          method: req.method,
          status: res.statusCode,
          requestBody,
          responseBody: {
            ...sanitizedResponseBody,
            responseTime,
          },
        });
      } catch (error) {
        console.error('Failed to log access:', error);
      }
    });

    // Handle errors
    const originalNext = next;
    next = (err?: any) => {
      if (err) {
        // Log error
        this.logError(req, err).catch(console.error);
      }
      originalNext(err);
    };

    next();
  }

  private async logError(req: ExtendedRequest, error: any) {
    const userInfo = req.user || {};
    const ipAddress = 
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown';

    await this.loggingService.logError({
      userId: userInfo.userId,
      username: userInfo.username,
      aptosAddress: userInfo.aptosAddress,
      ipAddress,
      endpoint: req.originalUrl || req.url,
      method: req.method,
      errorMessage: error.message || 'Unknown error',
      stackTrace: error.stack,
    });
  }

  private sanitizeRequestBody(body: any): any {
    if (!body) return null;

    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'api_key',
      'jwt',
      'authorization',
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeResponseBody(body: any): any {
    if (!body) return null;

    // Limit response body size to prevent large logs
    const bodyString = JSON.stringify(body);
    if (bodyString.length > 10000) {
      return {
        message: 'Response body too large for logging',
        size: bodyString.length,
        truncated: true,
      };
    }

    const sanitized = { ...body };

    // Remove sensitive fields from response
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'api_key',
      'jwt',
      'access_token',
    ];

    function removeSensitiveFields(obj: any): any {
      if (Array.isArray(obj)) {
        return obj.map(removeSensitiveFields);
      }
      
      if (obj && typeof obj === 'object') {
        const cleaned = { ...obj };
        sensitiveFields.forEach(field => {
          if (cleaned[field]) {
            cleaned[field] = '[REDACTED]';
          }
        });
        
        // Recursively clean nested objects
        Object.keys(cleaned).forEach(key => {
          if (cleaned[key] && typeof cleaned[key] === 'object') {
            cleaned[key] = removeSensitiveFields(cleaned[key]);
          }
        });
        
        return cleaned;
      }
      
      return obj;
    }

    return removeSensitiveFields(sanitized);
  }
} 