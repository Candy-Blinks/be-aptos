import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminService, LogFilters } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('access-logs')
  async getAccessLogs(@Query() filters: LogFilters) {
    return this.adminService.getAccessLogs(filters);
  }

  @Get('error-logs')
  async getErrorLogs(@Query() filters: LogFilters) {
    return this.adminService.getErrorLogs(filters);
  }

  @Get('stats')
  async getSystemStats() {
    return this.adminService.getSystemStats();
  }
} 