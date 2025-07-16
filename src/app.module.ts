import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { CollectionsController } from './collections/collections.controller';
import { CollectionsService } from './collections/collections.service';

@Module({
  imports: [UsersModule, ConfigModule.forRoot()],
  controllers: [AppController, CollectionsController],
  providers: [AppService, CollectionsService],
})
export class AppModule {}
