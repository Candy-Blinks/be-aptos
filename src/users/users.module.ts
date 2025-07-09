import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { LoggerMiddleware } from 'src/common/middleware/logger/logger.middleware';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // consumer.apply(LoggerMiddleware).forRoutes('users'); // ? option #1
    // consumer.apply(LoggerMiddleware).forRoutes(UsersController); // ? option #2
    // consumer // ? option #3
    // .apply(LoggerMiddleware)
    // .forRoutes({ path: 'users', method: RequestMethod.POST });
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: 'users', method: RequestMethod.POST });
    // throw new Error('Method not implemented.');
  }
}
