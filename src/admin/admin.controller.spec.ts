import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

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