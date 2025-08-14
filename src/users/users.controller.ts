import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  ValidationPipe,
  ConflictException,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePointsDto } from './dto/update-points.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { AptosAddressDto } from '../posts/dto/aptos-address.dto';
import { FollowUserDto } from './dto/follow-user.dto';
import { GetFollowersDto } from './dto/get-followers.dto';
import { CheckFollowStatusDto } from './dto/check-follow-status.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(ApiKeyGuard)
@ApiSecurity('api-key')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('followers')
  @ApiOperation({ summary: 'Get user followers with pagination' })
  @ApiResponse({ status: 200, description: 'List of followers' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserFollowers(
    @Query(ValidationPipe) getFollowersDto: GetFollowersDto,
  ) {
    return this.usersService.getFollowers(
      getFollowersDto.aptos_address,
      getFollowersDto.take,
      getFollowersDto.skip,
    );
  }

  @Get('following')
  @ApiOperation({
    summary: 'Get users that this user is following with pagination',
  })
  @ApiResponse({ status: 200, description: 'List of following' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserFollowing(
    @Query(ValidationPipe) getFollowersDto: GetFollowersDto,
  ) {
    return this.usersService.getFollowing(
      getFollowersDto.aptos_address,
      getFollowersDto.take,
      getFollowersDto.skip,
    );
  }

  @Get('follow-status')
  @ApiOperation({ summary: 'Check if one user follows another' })
  @ApiResponse({
    status: 200,
    description: 'Follow status',
    schema: {
      example: {
        isFollowing: true,
        follow_id: 'user123',
      },
    },
  })
  async getFollowStatus(
    @Query(ValidationPipe) checkFollowStatusDto: CheckFollowStatusDto,
  ) {
    return this.usersService.checkFollowStatus(
      checkFollowStatusDto.follower_aptos_address,
      checkFollowStatusDto.following_aptos_address,
    );
  }

  @Get('check-username')
  @ApiOperation({ summary: 'Check if username is available' })
  @ApiQuery({
    name: 'username',
    description: 'Username to check',
    example: 'johndoe',
  })
  @ApiResponse({ status: 200, description: 'Username availability status' })
  async checkUsernameAvailability(@Query('username') username: string) {
    if (!username) {
      throw new Error('Username query parameter is required');
    }

    return this.usersService.checkUsernameAvailability(username);
  }

  @Get('check-aptos-address')
  @ApiOperation({ summary: 'Check if Aptos address is available' })
  @ApiQuery({
    name: 'aptos_address',
    description: 'Aptos address to check',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Aptos address availability status',
  })
  async checkAptosAddressAvailability(
    @Query('aptos_address') aptosAddress: string,
  ) {
    if (!aptosAddress) {
      throw new Error('Aptos address query parameter is required');
    }

    return this.usersService.checkAptosAddressAvailability(aptosAddress);
  }

  @Get('check-availability')
  @ApiOperation({
    summary: 'Check if username and Aptos address are available',
  })
  @ApiQuery({
    name: 'username',
    description: 'Username to check',
    example: 'johndoe',
  })
  @ApiQuery({
    name: 'aptos_address',
    description: 'Aptos address to check',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @ApiResponse({ status: 200, description: 'Combined availability status' })
  async checkAvailability(
    @Query('username') username: string,
    @Query('aptos_address') aptosAddress: string,
  ) {
    if (!username || !aptosAddress) {
      throw new Error(
        'Both username and aptos_address query parameters are required',
      );
    }

    return this.usersService.checkUserExists(username, aptosAddress);
  }

  @Get('check-referral-code')
  @ApiOperation({ summary: 'Check if referral code is valid' })
  @ApiQuery({
    name: 'referral_code',
    description: 'Referral code to check',
    example: 'ref123456',
  })
  @ApiResponse({ status: 200, description: 'Referral code validation status' })
  async checkReferralCode(@Query('referral_code') referralCode: string) {
    if (!referralCode) {
      throw new Error('referral_code query parameter is required');
    }

    return this.usersService.checkReferralCodeExists(referralCode);
  }

  @Get('referral-code')
  @ApiOperation({ summary: 'Get user referral code' })
  @ApiQuery({
    name: 'aptos_address',
    description: 'Aptos address of the user',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @ApiResponse({ status: 200, description: 'User referral information' })
  async getUserReferralCode(@Query('aptos_address') aptosAddress: string) {
    if (!aptosAddress) {
      throw new Error('aptos_address query parameter is required');
    }

    return this.usersService.getUserReferralCode(aptosAddress);
  }

  @Get('check-email')
  @ApiOperation({ summary: 'Check if email is available' })
  @ApiQuery({
    name: 'email',
    description: 'Email to check',
    example: 'john@example.com',
  })
  @ApiResponse({ status: 200, description: 'Email availability status' })
  async checkEmailAvailability(@Query('email') email: string) {
    if (!email) {
      throw new Error('Email query parameter is required');
    }

    return this.usersService.checkEmailAvailability(email);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        id: 'clx1234567890',
        username: 'johndoe',
        aptos_address:
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        display_name: 'John Doe',
        email: 'john@example.com',
        profile_url: 'https://example.com/profile.jpg',
        referral_code: 'ref123456',
        referred_by: null,
        referral_count: 0,
        activity_points: 0,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Username, Aptos address, or email already exists',
  })
  async create(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    try {
      // Check if user already exists before attempting registration
      const existsCheck = await this.usersService.checkUserExists(
        createUserDto.username,
        createUserDto.aptos_address,
      );

      if (existsCheck.exists) {
        const errorDetails = {
          username: createUserDto.username,
          aptos_address: createUserDto.aptos_address,
          usernameExists: existsCheck.usernameExists,
          aptosAddressExists: existsCheck.aptosAddressExists,
        };

        if (existsCheck.usernameExists && existsCheck.aptosAddressExists) {
          throw new ConflictException(
            'Both username and aptos address are already registered',
          );
        } else if (existsCheck.usernameExists) {
          throw new ConflictException('Username is already taken');
        } else if (existsCheck.aptosAddressExists) {
          throw new ConflictException('Aptos address is already registered');
        }
      }

      // Check email availability if provided
      if (createUserDto.email) {
        const emailCheck = await this.usersService.checkEmailAvailability(
          createUserDto.email,
        );
        if (!emailCheck.available) {
          throw new ConflictException('Email is already registered');
        }
      }

      // Validate referral code if provided
      if (createUserDto.referral_code) {
        const referralCheck = await this.usersService.checkReferralCodeExists(
          createUserDto.referral_code,
        );

        if (!referralCheck.exists) {
          throw new ConflictException(referralCheck.message);
        }
      }

      // Attempt to create the user
      const newUser = await this.usersService.create(createUserDto);

      return newUser;
    } catch (error) {
      // Re-throw the error to be handled by the global exception filter
      throw error;
    }
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiQuery({
    name: 'skip',
    description: 'Number of users to skip',
    example: 0,
    required: false,
  })
  @ApiQuery({
    name: 'take',
    description: 'Number of users to return',
    example: 50,
    required: false,
  })
  @ApiResponse({ status: 200, description: 'List of users' })
  async findAll(@Query('skip') skip?: string, @Query('take') take?: string) {
    const skipNum = skip ? parseInt(skip, 10) : undefined;
    const takeNum = take ? parseInt(take, 10) : undefined;

    return this.usersService.findAll(skipNum, takeNum);
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Get user by username' })
  @ApiParam({
    name: 'username',
    description: 'Username to find',
    example: 'johndoe',
  })
  @ApiResponse({ status: 200, description: 'User information' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findByUsername(@Param('username') username: string) {
    if (!username) {
      throw new Error('Username parameter is required');
    }

    return this.usersService.findByUsername(username);
  }

  @Get('address/:address')
  @ApiOperation({ summary: 'Get user by Aptos address' })
  @ApiParam({
    name: 'address',
    description: 'Aptos address to find',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @ApiResponse({ status: 200, description: 'User information' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findByAptosAddress(@Param('address') aptosAddress: string) {
    if (!aptosAddress) {
      throw new Error('Aptos address parameter is required');
    }
    return this.usersService.findByAptosAddress(aptosAddress);
  }

  @Get('referral-stats')
  @ApiOperation({ summary: 'Get user referral statistics' })
  @ApiQuery({
    name: 'aptos_address',
    description: 'Aptos address of the user',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @ApiResponse({ status: 200, description: 'Referral statistics' })
  async getReferralStats(@Query('aptos_address') aptosAddress: string) {
    if (!aptosAddress) {
      throw new Error('aptos_address query parameter is required');
    }
    return this.usersService.getReferralStats(aptosAddress);
  }

  @Post('increment-points')
  @ApiOperation({ summary: 'Increment user activity points' })
  @ApiResponse({ status: 200, description: 'Points incremented successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async incrementPoints(
    @Body(ValidationPipe) updatePointsDto: UpdatePointsDto,
  ) {
    return this.usersService.incrementPoints(updatePointsDto);
  }

  @Post('decrement-points')
  @ApiOperation({ summary: 'Decrement user activity points' })
  @ApiResponse({ status: 200, description: 'Points decremented successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async decrementPoints(
    @Body(ValidationPipe) updatePointsDto: UpdatePointsDto,
  ) {
    return this.usersService.decrementPoints(updatePointsDto);
  }

  @Post('follow')
  @ApiOperation({ summary: 'Follow a user' })
  @ApiResponse({ status: 200, description: 'User followed successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async follow(@Body(ValidationPipe) followUserDto: FollowUserDto) {
    return this.usersService.follow(followUserDto);
  }

  @Post('unfollow')
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiResponse({ status: 200, description: 'User unfollowed successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unfollow(@Body(ValidationPipe) followUserDto: FollowUserDto) {
    return this.usersService.unfollow(followUserDto);
  }

  @Post('upload-profile-picture')
  @ApiOperation({ summary: 'Upload user profile picture' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Profile picture file (max 5MB)',
        },
      },
    },
  })
  @ApiQuery({
    name: 'aptos_address',
    description: 'Aptos address of the user',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile picture uploaded successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @Query('aptos_address') aptosAddress: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!aptosAddress) {
      throw new Error('aptos_address query parameter is required');
    }

    return this.usersService.updateProfilePicture(aptosAddress, file);
  }

  @Post('upload-header-picture')
  @ApiOperation({ summary: 'Upload user header picture' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Header picture file (max 10MB)',
        },
      },
    },
  })
  @ApiQuery({
    name: 'aptos_address',
    description: 'Aptos address of the user',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Header picture uploaded successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadHeaderPicture(
    @Query('aptos_address') aptosAddress: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!aptosAddress) {
      throw new Error('aptos_address query parameter is required');
    }

    return this.usersService.updateHeaderPicture(aptosAddress, file);
  }

  @Post('complete-onboarding')
  @ApiOperation({ summary: 'Mark user onboarding as complete' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding completed successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async completeOnboarding(
    @Body(ValidationPipe) aptosAddressDto: AptosAddressDto,
  ) {
    return this.usersService.completeOnboarding(aptosAddressDto.aptos_address);
  }

  @Get('profile/:address')
  @ApiOperation({ summary: 'Get comprehensive user profile' })
  @ApiParam({
    name: 'address',
    description: 'Aptos address of the user',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @ApiResponse({ status: 200, description: 'User profile information' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfile(@Param('address') aptosAddress: string) {
    if (!aptosAddress) {
      throw new Error('Aptos address parameter is required');
    }

    return this.usersService.getUserProfile(aptosAddress);
  }
}
