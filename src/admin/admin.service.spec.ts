import { Test, TestingModule } from '@nestjs/testing';
import { AdminService, LogFilters } from './admin.service';
import { LoggingService } from '../logging/logging.service';

describe('AdminService', () => {
  let service: AdminService;
  let loggingService: LoggingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: LoggingService,
          useValue: {
            getAccessLogs: jest.fn(),
            getErrorLogs: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    loggingService = module.get<LoggingService>(LoggingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAccessLogs', () => {
    it('should get access logs with default parameters', async () => {
      const mockLogs = [
        {
          id: 'log1',
          endpoint: '/api/users',
          method: 'GET',
          status: 200,
          created_at: new Date(),
        },
      ];
      const filters: LogFilters = {};

      (loggingService.getAccessLogs as jest.Mock).mockResolvedValue(mockLogs);

      const result = await service.getAccessLogs(filters);

      expect(loggingService.getAccessLogs).toHaveBeenCalledWith({
        startDate: undefined,
        endDate: undefined,
        skip: 0,
        take: 50,
      });
      expect(result).toEqual(mockLogs);
    });

    it('should get access logs with date filters', async () => {
      const mockLogs = [];
      const filters: LogFilters = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        aptos_address: 'test-address',
        endpoint: '/api/users',
        skip: 10,
        take: 20,
      };

      (loggingService.getAccessLogs as jest.Mock).mockResolvedValue(mockLogs);

      const result = await service.getAccessLogs(filters);

      expect(loggingService.getAccessLogs).toHaveBeenCalledWith({
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        aptos_address: 'test-address',
        endpoint: '/api/users',
        skip: 10,
        take: 20,
      });
      expect(result).toEqual(mockLogs);
    });

    it('should convert string numbers to integers', async () => {
      const filters: LogFilters = {
        skip: '5' as any,
        take: '15' as any,
      };

      (loggingService.getAccessLogs as jest.Mock).mockResolvedValue([]);

      await service.getAccessLogs(filters);

      expect(loggingService.getAccessLogs).toHaveBeenCalledWith({
        startDate: undefined,
        endDate: undefined,
        skip: 5,
        take: 15,
      });
    });
  });

  describe('getErrorLogs', () => {
    it('should get error logs with default parameters', async () => {
      const mockLogs = [
        {
          id: 'error1',
          endpoint: '/api/posts',
          method: 'POST',
          error_message: 'Test error',
          created_at: new Date(),
        },
      ];
      const filters: LogFilters = {};

      (loggingService.getErrorLogs as jest.Mock).mockResolvedValue(mockLogs);

      const result = await service.getErrorLogs(filters);

      expect(loggingService.getErrorLogs).toHaveBeenCalledWith({
        startDate: undefined,
        endDate: undefined,
        skip: 0,
        take: 50,
      });
      expect(result).toEqual(mockLogs);
    });

    it('should get error logs with all filters', async () => {
      const mockLogs = [];
      const filters: LogFilters = {
        startDate: '2023-06-01',
        endDate: '2023-06-30',
        aptos_address: 'test-address',
        endpoint: '/api/posts',
        skip: 20,
        take: 30,
      };

      (loggingService.getErrorLogs as jest.Mock).mockResolvedValue(mockLogs);

      const result = await service.getErrorLogs(filters);

      expect(loggingService.getErrorLogs).toHaveBeenCalledWith({
        startDate: new Date('2023-06-01'),
        endDate: new Date('2023-06-30'),
        aptos_address: 'test-address',
        endpoint: '/api/posts',
        skip: 20,
        take: 30,
      });
      expect(result).toEqual(mockLogs);
    });
  });

  describe('getSystemStats', () => {
    it('should return system stats', async () => {
      const result = await service.getSystemStats();

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('timestamp');
      expect(result.message).toBe('System stats endpoint - can be expanded with metrics');
      expect(typeof result.timestamp).toBe('string');
    });
  });
}); 