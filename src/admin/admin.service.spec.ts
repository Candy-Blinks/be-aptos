import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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