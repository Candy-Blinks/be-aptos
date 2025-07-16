import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { GraphQLClient, gql } from 'graphql-request';
import { ConfigService } from '@nestjs/config';

export interface Collection {
  collection_name: string;
  collection_owner: string;
  collection_uri: string;
  max_supply?: number;
  number_of_mints?: number;
  collection_description?: string;
}

@Injectable()
export class CollectionsService {
  private readonly logger = new Logger(CollectionsService.name);
  private client: GraphQLClient;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('APTOS_API_KEY');
    if (!apiKey) {
      throw new Error('APTOS_API_KEY is not configured');
    }

    this.client = new GraphQLClient(
      'https://api.testnet.aptoslabs.com/nocode/v1/api/cmd3n0anc009rs6017nbuiayf/v1/graphql',
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );
  }

  async getOwnedCollections(owner: string): Promise<Collection[]> {
    const query = gql`
      query GetCollections($owner: String!) {
        collections(where: { collection_owner: { _eq: $owner } }) {
          collection_name
          collection_owner
          collection_uri
          max_supply
          number_of_mints
          collection_description
          token_description
          token_uri
          token_name
        }
      }
    `;

    const variables = { owner };

    this.logger.debug(`Executing query for owner: ${owner}`);
    try {
      const data = await this.client.request<{ collections: Collection[] }>(
        query, // Pass as raw string
        variables,
      );
      return data.collections;
    } catch (error) {
      console.error('Full error details:', {
        message: error.message,
        response: error.response,
        request: error.request,
      });
      throw new InternalServerErrorException(
        `Failed to fetch collections: ${error.message}`,
      );
    }
  }

  async getCollection(owner: string, name: string): Promise<Collection> {
    const query = gql`
      query GetSpecificCollection($owner: String!, $name: String!) {
        collections(
          where: {
            _and: [
              { collection_owner: { _eq: $owner } }
              { collection_name: { _eq: $name } }
            ]
          }
        ) {
          collection_name
          collection_owner
          collection_uri
          max_supply
          number_of_mints
          collection_description
          token_description
          token_uri
          token_name
        }
      }
    `;

    const variables = { owner, name };

    this.logger.debug(`Executing query for owner: ${owner} and name: ${name}`);
    try {
      const data = await this.client.request<{ collections: Collection[] }>(
        query,
        variables,
      );

      if (data.collections.length === 0) {
        throw new NotFoundException(
          `No collection found for owner: ${owner} and name: ${name}`,
        );
      }

      return data.collections[0];
    } catch (error) {
      console.error('Full error details:', {
        message: error.message,
        response: error.response,
        request: error.request,
      });
      throw new InternalServerErrorException(
        `Failed to fetch collection: ${error.message}`,
      );
    }
  }
}
