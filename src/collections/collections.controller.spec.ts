import { Test, TestingModule } from '@nestjs/testing';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';

describe('CollectionsController', () => {
  let controller: CollectionsController;
  let collectionsService: CollectionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CollectionsController],
      providers: [
        {
          provide: CollectionsService,
          useValue: {
            getOwnedCollections: jest.fn(),
            getCollection: jest.fn(),
          },
        },
      ],
    })
    .overrideGuard(require('../auth/guards/api-key.guard').ApiKeyGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<CollectionsController>(CollectionsController);
    collectionsService = module.get<CollectionsService>(CollectionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOwnedCollections', () => {
    it('should return owned collections', async () => {
      const mockCollections = [
        {
          id: 1,
          collection_id: 'test-collection',
          total_supply: 100,
          name: 'Test Collection',
          uri: 'https://test.com',
        },
      ];

      (collectionsService.getOwnedCollections as jest.Mock).mockResolvedValue(mockCollections);

      const result = await controller.getOwnedCollections('test-address');

      expect(collectionsService.getOwnedCollections).toHaveBeenCalledWith('test-address');
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

      (collectionsService.getCollection as jest.Mock).mockResolvedValue(mockCollection);

      const result = await controller.getCollection('test-collection', 'Test Collection');

      expect(collectionsService.getCollection).toHaveBeenCalledWith('test-collection', 'Test Collection');
      expect(result).toEqual(mockCollection);
    });
  });
});
