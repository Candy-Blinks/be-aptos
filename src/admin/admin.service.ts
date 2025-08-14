import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  constructor() {}

  async getSystemStats() {
    // This could be expanded to include more system statistics
    return {
      message: 'System stats endpoint - can be expanded with metrics',
      timestamp: new Date().toISOString(),
    };
  }
} 