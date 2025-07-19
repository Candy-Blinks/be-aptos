import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService, LogFilters } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: {
            getAccessLogs: jest.fn(),
            getErrorLogs: jest.fn(),
            getSystemStats: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAccessLogs', () => {
    it('should get access logs successfully', async () => {
      const mockLogs = [
        {
          id: 'log1',
          endpoint: '/api/users',
          method: 'GET',
          status: 200,
          created_at: new Date(),
        },
      ];
      const filters: LogFilters = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      };

      (adminService.getAccessLogs as jest.Mock).mockResolvedValue(mockLogs);

      const result = await controller.getAccessLogs(filters);

      expect(adminService.getAccessLogs).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockLogs);
    });

    it('should handle service errors', async () => {
      const filters: LogFilters = {};
      (adminService.getAccessLogs as jest.Mock).mockRejectedValue(new Error('Service error'));

      await expect(controller.getAccessLogs(filters)).rejects.toThrow('Service error');
    });
  });

  describe('getErrorLogs', () => {
    it('should get error logs successfully', async () => {
      const mockLogs = [
        {
          id: 'error1',
          endpoint: '/api/posts',
          method: 'POST',
          error_message: 'Test error',
          created_at: new Date(),
        },
      ];
      const filters: LogFilters = {
        aptos_address: 'test-address',
        endpoint: '/api/posts',
      };

      (adminService.getErrorLogs as jest.Mock).mockResolvedValue(mockLogs);

      const result = await controller.getErrorLogs(filters);

      expect(adminService.getErrorLogs).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockLogs);
    });

    it('should handle service errors', async () => {
      const filters: LogFilters = {};
      (adminService.getErrorLogs as jest.Mock).mockRejectedValue(new Error('Service error'));

      await expect(controller.getErrorLogs(filters)).rejects.toThrow('Service error');
    });
  });

  describe('getSystemStats', () => {
    it('should get system stats successfully', async () => {
      const mockStats = {
        message: 'System stats endpoint - can be expanded with metrics',
        timestamp: new Date().toISOString(),
      };

      (adminService.getSystemStats as jest.Mock).mockResolvedValue(mockStats);

      const result = await controller.getSystemStats();

      expect(adminService.getSystemStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });

    it('should handle service errors', async () => {
      (adminService.getSystemStats as jest.Mock).mockRejectedValue(new Error('Service error'));

      await expect(controller.getSystemStats()).rejects.toThrow('Service error');
    });
  });
}); 