import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePointsDto } from './dto/update-points.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Controller('users')
@UseGuards(ApiKeyGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  async create(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findByAptosAddress(@Query('aptos_address') aptosAddress: string) {
    if (!aptosAddress) {
      throw new Error('aptos_address query parameter is required');
    }
    return this.usersService.findByAptosAddress(aptosAddress);
  }

  @Post('increment-points')
  async incrementPoints(@Body(ValidationPipe) updatePointsDto: UpdatePointsDto) {
    return this.usersService.incrementPoints(updatePointsDto);
  }

  @Post('decrement-points')
  async decrementPoints(@Body(ValidationPipe) updatePointsDto: UpdatePointsDto) {
    return this.usersService.decrementPoints(updatePointsDto);
  }
}
