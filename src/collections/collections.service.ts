import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

export interface Collection {
  collection_name: string;
  collection_owner: string;
  collection_uri: string;
  max_supply?: number;
  number_of_mints?: number;
  collection_description?: string;
  token_description?: string;
  token_uri?: string;
  token_name?: string;
}

@Injectable()
export class CollectionsService {
  private readonly logger = new Logger(CollectionsService.name);

  constructor(private prisma: PrismaClient) {} // Injected globally

  async getOwnedCollections(owner: string): Promise<Collection[]> {
    this.logger.debug(`Fetching collections for owner: ${owner}`);
    try {
      const collections = await this.prisma.collection.findMany({
        where: {
          collection_owner: owner,
        },
      });
      return collections;
    } catch (error) {
      this.logger.error('Failed to fetch collections', error.stack);
      throw new InternalServerErrorException(
        `Failed to fetch collections: ${error.message}`,
      );
    }
  }

  async getCollection(owner: string, name: string): Promise<Collection> {
    this.logger.debug(
      `Fetching collection for owner: ${owner} and name: ${name}`,
    );
    try {
      const collection = await this.prisma.collection.findUnique({
        where: {
          collection_name_collection_owner: {
            collection_owner: owner,
            collection_name: name,
          },
        },
      });

      if (!collection) {
        throw new NotFoundException(
          `No collection found for owner: ${owner} and name: ${name}`,
        );
      }

      return collection;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to fetch collection', error.stack);
      throw new InternalServerErrorException(
        `Failed to fetch collection: ${error.message}`,
      );
    }
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
