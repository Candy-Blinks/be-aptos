import { Injectable } from '@nestjs/common';
import { LoggingService } from '../logging/logging.service';

export interface LogFilters {
  startDate?: string;
  endDate?: string;
  aptos_address?: string;
  endpoint?: string;
  skip?: number;
  take?: number;
}

@Injectable()
export class AdminService {
  constructor(private loggingService: LoggingService) {}

  async getAccessLogs(filters: LogFilters) {
    const processedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      skip: filters.skip ? Number(filters.skip) : 0,
      take: filters.take ? Number(filters.take) : 50,
    };

    return this.loggingService.getAccessLogs(processedFilters);
  }

  async getErrorLogs(filters: LogFilters) {
    const processedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      skip: filters.skip ? Number(filters.skip) : 0,
      take: filters.take ? Number(filters.take) : 50,
    };

    return this.loggingService.getErrorLogs(processedFilters);
  }

  async getSystemStats() {
    // This could be expanded to include more system statistics
    return {
      message: 'System stats endpoint - can be expanded with metrics',
      timestamp: new Date().toISOString(),
    };
  }
} 