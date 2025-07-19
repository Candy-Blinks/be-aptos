import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePointsDto } from './dto/update-points.dto';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Convert username to lowercase
      const username = createUserDto.username.toLowerCase();

      // Check if username or aptos_address already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { username },
            { aptos_address: createUserDto.aptos_address },
          ],
        },
      });

      if (existingUser) {
        if (existingUser.username === username) {
          throw new ConflictException('Username already exists');
        }
        if (existingUser.aptos_address === createUserDto.aptos_address) {
          throw new ConflictException('Aptos address already registered');
        }
      }

      const user = await this.prisma.user.create({
        data: {
          ...createUserDto,
          username,
          socials: createUserDto.socials || {
            website: '',
            x: '',
            tiktok: '',
            linkedin: '',
            youtube: '',
            instagram: '',
            facebook: '',
          },
        },
      });

      return user;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async findByAptosAddress(aptosAddress: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { aptos_address: aptosAddress },
      include: {
        posts: {
          take: 10,
          orderBy: { created_at: 'desc' },
        },
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async incrementPoints(updatePointsDto: UpdatePointsDto): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { aptos_address: updatePointsDto.aptos_address },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { aptos_address: updatePointsDto.aptos_address },
      data: {
        activity_points: {
          increment: updatePointsDto.points,
        },
      },
    });
  }

  async decrementPoints(updatePointsDto: UpdatePointsDto): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { aptos_address: updatePointsDto.aptos_address },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Ensure points don't go below 0
    const newPoints = Math.max(0, user.activity_points - updatePointsDto.points);

    return this.prisma.user.update({
      where: { aptos_address: updatePointsDto.aptos_address },
      data: {
        activity_points: newPoints,
      },
    });
  }
}
