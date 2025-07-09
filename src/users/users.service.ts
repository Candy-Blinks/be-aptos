import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './users.interface';

@Injectable()
export class UsersService {
  private readonly users: User[] = [];

  create(user: User): User[] {
    this.users.push(user);
    return this.users;
  }

  findAll(): User[] {
    return this.users;
  }

  findOne(id: number): User | undefined {
    const user = this.users.find((user) => user.id === id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}
