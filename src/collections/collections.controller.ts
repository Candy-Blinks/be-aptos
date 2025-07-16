import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { Collection } from './collections.service';
import { CollectionsService } from './collections.service';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionService: CollectionsService) {}

  @Get('owned-collections')
  async getOwnedCollections(
    @Query('owner') owner: string,
  ): Promise<Collection[]> {
    if (!owner) {
      throw new BadRequestException('Missing "owner" query parameter');
    }

    return this.collectionService.getOwnedCollections(owner);
  }

  @Get('collection')
  async getCollection(
    @Query('owner') owner: string,
    @Query('name') name: string,
  ): Promise<Collection> {
    if (!owner || !name) {
      throw new BadRequestException(
        'Missing "owner" or "name" query parameter',
      );
    }

    return await this.collectionService.getCollection(owner, name);
  }
}
