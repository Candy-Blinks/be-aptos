import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDTO } from './dto/create-user-dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Post()
  create(@Body() createUserDTO: CreateUserDTO) {
    // const newId = this.usersService.findAll().length + 1;
    // const newUser = {
    //   id: newId,
    //   name: 'John Doe',
    //   username: 'momo',
    //   aptos_wallet_address: '0xblinks',
    // };
    return this.usersService.create(createUserDTO);
  }

  @Get()
  findAll() {
    try {
      return this.usersService.findAll();
    } catch (e) {
      throw new HttpException(
        'Error fetching users',
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }

  @Post(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  update() {
    return 'Update user';
  }

  @Delete(':id')
  delete() {
    return 'Deletes user';
  }
}
