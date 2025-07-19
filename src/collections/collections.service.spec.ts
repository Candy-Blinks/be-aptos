import { Test, TestingModule } from '@nestjs/testing';
import { CollectionsService } from './collections.service';
import { PrismaService } from '../prisma/prisma.service';
import { TestUtils } from '../../test/test-utils';

describe('CollectionsService', () => {
  let service: CollectionsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionsService,
        {
          provide: PrismaService,
          useValue: TestUtils.createMockPrismaService(),
        },
      ],
    }).compile();

    service = module.get<CollectionsService>(CollectionsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOwnedCollections', () => {
    it('should return collections for a valid user', async () => {
      const mockCollections = [
        {
          id: 1,
          collection_id: 'test-collection',
          total_supply: 100,
          name: 'Test Collection',
          uri: 'https://test.com',
        },
      ];

      (prismaService.collection.findMany as jest.Mock).mockResolvedValue(mockCollections);

      const result = await service.getOwnedCollections('test-address');

      expect(prismaService.collection.findMany).toHaveBeenCalledWith({
        where: { collection_owner: 'test-address' },
      });
      expect(result).toEqual(mockCollections);
    });
  });

  describe('getCollection', () => {
    it('should return a specific collection', async () => {
      const mockCollection = {
        id: 1,
        collection_id: 'test-collection',
        total_supply: 100,
        name: 'Test Collection',
        uri: 'https://test.com',
      };

      (prismaService.collection.findUnique as jest.Mock).mockResolvedValue(mockCollection);

      const result = await service.getCollection('test-owner', 'Test Collection');

      expect(prismaService.collection.findUnique).toHaveBeenCalledWith({
        where: {
          collection_name_collection_owner: {
            collection_name: 'Test Collection',
            collection_owner: 'test-owner',
          },
        },
      });
      expect(result).toEqual(mockCollection);
    });

    it('should throw NotFoundException for non-existent collection', async () => {
      (prismaService.collection.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getCollection('test-owner', 'Non-existent')).rejects.toThrow('No collection found for owner: test-owner and name: Non-existent');
    });
  });
});
