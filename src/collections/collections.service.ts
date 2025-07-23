import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
  published?: boolean;
}

@Injectable()
export class CollectionsService {
  private readonly logger = new Logger(CollectionsService.name);

  constructor(private prisma: PrismaService) {}

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
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error('Failed to fetch collections', errorStack);
      throw new InternalServerErrorException(
        `Failed to fetch collections: ${errorMessage}`,
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
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error('Failed to fetch collection', errorStack);
      throw new InternalServerErrorException(
        `Failed to fetch collection: ${errorMessage}`,
      );
    }
  }

  async getCollections(): Promise<Collection[]> {
    this.logger.debug('Fetching all collections');
    try {
      const collections = await this.prisma.collection.findMany();

      if (!collections) {
        throw new NotFoundException('No collections found');
      }
      return collections;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error('Failed to fetch collection', errorStack);
      throw new InternalServerErrorException(
        `Failed to fetch collection: ${errorMessage}`,
      );
    }
  }

  async updatePublishedStatus(
    owner: string,
    name: string,
    published: boolean,
  ): Promise<Collection> {
    this.logger.debug(
      `Updating published status to ${published} for collection: ${name}, owner: ${owner}`,
    );
    //TODO Add validation that only the owner can update the published status
    try {
      const updated = await this.prisma.collection.update({
        where: {
          collection_name_collection_owner: {
            collection_owner: owner,
            collection_name: name,
          },
        },
        data: {
          published,
        },
      });

      return updated;
    } catch (error) {
      if (error.code === 'P2025') {
        // Record not found
        throw new NotFoundException(
          `Collection not found for owner: ${owner}, name: ${name}`,
        );
      }

      this.logger.error('Failed to update published status', error.stack);
      throw new InternalServerErrorException(
        `Failed to update published status: ${error.message}`,
      );
    }
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
