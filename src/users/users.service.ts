import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePointsDto } from './dto/update-points.dto';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
  ) {}

  async updateProfilePicture(
    aptosAddress: string,
    file: Express.Multer.File,
  ): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { aptos_address: aptosAddress },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete old profile picture if exists
    if (user.profile_url) {
      try {
        const publicId = this.filesService.extractPublicId(user.profile_url);
        await this.filesService.deleteImage(publicId);
      } catch (error) {
        console.warn('Failed to delete old profile picture:', error);
      }
    }

    // Upload new profile picture
    const profileUrl = await this.filesService.uploadImage(file, 'profiles');

    return this.prisma.user.update({
      where: { aptos_address: aptosAddress },
      data: { profile_url: profileUrl },
    });
  }

  async updateHeaderPicture(
    aptosAddress: string,
    file: Express.Multer.File,
  ): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { aptos_address: aptosAddress },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete old header picture if exists
    if (user.header_url) {
      try {
        const publicId = this.filesService.extractPublicId(user.header_url);
        await this.filesService.deleteImage(publicId);
      } catch (error) {
        console.warn('Failed to delete old header picture:', error);
      }
    }

    // Upload new header picture
    const headerUrl = await this.filesService.uploadImage(file, 'headers');

    return this.prisma.user.update({
      where: { aptos_address: aptosAddress },
      data: { header_url: headerUrl },
    });
  }

  async findAll(skip?: number, take?: number) {
    return this.prisma.user.findMany({
      skip: skip || 0,
      take: take || 50, // Default limit of 50 users
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        username: true,
        aptos_address: true,
        display_name: true,
        profile_url: true,
        activity_points: true,
        referral_count: true,
        referral_code: true,
        referred_by: true,
        created_at: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });
  }

  async findByUsername(username: string): Promise<User> {
    const normalizedUsername = username.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { username: normalizedUsername },
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

  async checkUsernameAvailability(username: string) {
    const normalizedUsername = username.toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: { username: true },
    });

    return {
      available: !existingUser,
      username: normalizedUsername,
    };
  }

  async checkAptosAddressAvailability(aptosAddress: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { aptos_address: aptosAddress },
      select: { aptos_address: true },
    });

    return {
      available: !existingUser,
      aptos_address: aptosAddress,
    };
  }

  async checkUserExists(username: string, aptosAddress: string) {
    const normalizedUsername = username.toLowerCase();

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: normalizedUsername }, { aptos_address: aptosAddress }],
      },
      select: {
        username: true,
        aptos_address: true,
      },
    });

    if (!existingUser) {
      return { exists: false };
    }

    return {
      exists: true,
      usernameExists: existingUser.username === normalizedUsername,
      aptosAddressExists: existingUser.aptos_address === aptosAddress,
    };
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Convert username to lowercase
      const username = createUserDto.username.toLowerCase();

      // Check if username, aptos_address, or email already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { username },
            { aptos_address: createUserDto.aptos_address },
            ...(createUserDto.email ? [{ email: createUserDto.email }] : []),
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
        if (createUserDto.email && existingUser.email === createUserDto.email) {
          throw new ConflictException('Email already registered');
        }
      }

      // Handle referral code logic
      let referredBy: string | null = null;
      if (createUserDto.referral_code) {
        // Find the user who owns this referral code
        const referrer = await this.prisma.user.findUnique({
          where: { referral_code: createUserDto.referral_code },
        });

        if (!referrer) {
          throw new NotFoundException('Invalid referral code');
        }

        // Set the referral code as the referredBy value
        referredBy = createUserDto.referral_code;
      }

      // Create user with referral relationship
      const user = await this.prisma.user.create({
        data: {
          username,
          aptos_address: createUserDto.aptos_address,
          display_name: createUserDto.display_name,
          email: createUserDto.email || null,
          profile_url: createUserDto.profile_url || null,
          referred_by: referredBy,
          socials: {
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

      // If user was referred, increment referrer's referral count
      if (referredBy) {
        await this.prisma.user.update({
          where: { referral_code: referredBy },
          data: {
            referral_count: {
              increment: 1,
            },
          },
        });
      }

      return user;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new Error(
        `Failed to create user: ${error instanceof Error ? error.message : String(error)}`,
      );
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

  async getReferralStats(aptosAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { aptos_address: aptosAddress },
      select: {
        referral_code: true,
        referral_count: true,
        referred_by: true,
        referrer: {
          select: {
            username: true,
            display_name: true,
          },
        },
        referrals: {
          select: {
            username: true,
            display_name: true,
            created_at: true,
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async decrementPoints(updatePointsDto: UpdatePointsDto): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { aptos_address: updatePointsDto.aptos_address },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Ensure points don't go below 0
    const newPoints = Math.max(
      0,
      user.activity_points - updatePointsDto.points,
    );

    return this.prisma.user.update({
      where: { aptos_address: updatePointsDto.aptos_address },
      data: {
        activity_points: newPoints,
      },
    });
  }

  async checkReferralCodeExists(referralCode: string) {
    if (!referralCode || referralCode.trim() === '') {
      return {
        exists: false,
        message: 'Referral code is required',
      };
    }

    const referrer = await this.prisma.user.findUnique({
      where: { referral_code: referralCode },
      select: {
        id: true,
        username: true,
        display_name: true,
        referral_code: true,
        referral_count: true,
        created_at: true,
      },
    });

    if (!referrer) {
      return {
        exists: false,
        message: 'Invalid referral code',
      };
    }

    return {
      exists: true,
      message: 'Valid referral code',
      referrer: {
        username: referrer.username,
        display_name: referrer.display_name,
        referral_count: referrer.referral_count,
        member_since: referrer.created_at,
      },
    };
  }

  async getUserReferralCode(aptosAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { aptos_address: aptosAddress },
      select: {
        referral_code: true,
        referral_count: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      referral_code: user.referral_code,
      referral_count: user.referral_count,
      referral_link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${user.referral_code}`,
    };
  }

  async getUserProfile(aptosAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { aptos_address: aptosAddress },
      select: {
        id: true,
        username: true,
        aptos_address: true,
        display_name: true,
        header_url: true,
        profile_url: true,
        bio: true,
        activity_points: true,
        referral_code: true,
        referral_count: true,
        referred_by: true,
        created_at: true,
        updated_at: true,
        socials: true,
        email: true, // Add email to the select
        // Include referrer information
        referrer: {
          select: {
            username: true,
            display_name: true,
            profile_url: true,
          },
        },
        // Include recent posts
        posts: {
          take: 10,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            content: true,
            media_urls: true,
            like_count: true,
            comment_count: true,
            share_count: true,
            created_at: true,
          },
        },
        // Include counts for followers, following, posts
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
            referrals: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    // Calculate profile completion percentage
    const profileFields = [
      user.display_name,
      user.bio,
      user.profile_url,
      user.header_url,
      user.socials && typeof user.socials === 'object'
        ? Object.values(user.socials as Record<string, string>).some(
            (val) => val && val.trim() !== '',
          )
        : false,
    ];

    const completedFields = profileFields.filter(
      (field) =>
        field && (typeof field === 'string' ? field.trim() !== '' : field),
    ).length;

    const profileCompletionPercentage = Math.round(
      (completedFields / profileFields.length) * 100,
    );

    // Format the response
    return {
      // Basic user information
      id: user.id,
      username: user.username,
      aptos_address: user.aptos_address,
      display_name: user.display_name,
      bio: user.bio,
      profile_url: user.profile_url,
      header_url: user.header_url,
      activity_points: user.activity_points,
      created_at: user.created_at,
      updated_at: user.updated_at,

      // Social links
      socials: user.socials,
      email: user.email, // Add email to the response

      // Referral information
      referral: {
        code: user.referral_code,
        count: user.referral_count,
        referred_by: user.referred_by,
        referrer: user.referrer
          ? {
              username: user.referrer.username,
              display_name: user.referrer.display_name,
              profile_url: user.referrer.profile_url,
            }
          : null,
        referral_link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${user.referral_code}`,
      },

      // Statistics
      stats: {
        posts_count: user._count.posts,
        followers_count: user._count.followers,
        following_count: user._count.following,
        referrals_count: user._count.referrals,
        profile_completion: profileCompletionPercentage,
      },

      // Recent posts
      recent_posts: user.posts,

      // Profile metadata
      profile_metadata: {
        is_verified: false, // You can add verification logic later
        member_since: user.created_at,
        last_active: user.updated_at,
        profile_views: 0, // You can track this separately if needed
      },
    };
  }

  async checkEmailAvailability(email: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email },
      select: { email: true },
    });

    return {
      available: !existingUser,
      email: email,
    };
  }
}
