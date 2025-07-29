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

@ApiTags('users')
@Controller('users')
@UseGuards(ApiKeyGuard)
@ApiSecurity('api-key')
export class UsersController {
  constructor(private usersService: UsersService) {}

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
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 📝 REGISTRATION ATTEMPT:`, {
      username: createUserDto.username,
      aptos_address: createUserDto.aptos_address,
      email: createUserDto.email || null,
      has_referral_code: !!createUserDto.referral_code,
      referral_code: createUserDto.referral_code || 'none',
    });

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
          console.log(
            `[${timestamp}] ❌ REGISTRATION FAILED - Both username and aptos address exist:`,
            errorDetails,
          );
          throw new ConflictException(
            'Both username and aptos address are already registered',
          );
        } else if (existsCheck.usernameExists) {
          console.log(
            `[${timestamp}] ❌ REGISTRATION FAILED - Username exists:`,
            errorDetails,
          );
          throw new ConflictException('Username is already taken');
        } else if (existsCheck.aptosAddressExists) {
          console.log(
            `[${timestamp}] ❌ REGISTRATION FAILED - Aptos address exists:`,
            errorDetails,
          );
          throw new ConflictException('Aptos address is already registered');
        }
      }

      // Check email availability if provided
      if (createUserDto.email) {
        const emailCheck = await this.usersService.checkEmailAvailability(
          createUserDto.email,
        );
        if (!emailCheck.available) {
          console.log(`[${timestamp}] ❌ REGISTRATION FAILED - Email exists:`, {
            username: createUserDto.username,
            email: createUserDto.email,
          });
          throw new ConflictException('Email is already registered');
        }
      }

      // Validate referral code if provided
      if (createUserDto.referral_code) {
        const referralCheck = await this.usersService.checkReferralCodeExists(
          createUserDto.referral_code,
        );

        if (!referralCheck.exists) {
          console.log(
            `[${timestamp}] ❌ REGISTRATION FAILED - Invalid referral code:`,
            {
              username: createUserDto.username,
              referral_code: createUserDto.referral_code,
              error: referralCheck.message,
            },
          );
          throw new ConflictException(referralCheck.message);
        } else {
          console.log(`[${timestamp}] ✅ REFERRAL CODE VALIDATED:`, {
            username: createUserDto.username,
            referral_code: createUserDto.referral_code,
            referrer: referralCheck.referrer?.username,
          });
        }
      }

      // Attempt to create the user
      const newUser = await this.usersService.create(createUserDto);

      console.log(`[${timestamp}] ✅ REGISTRATION SUCCESS:`, {
        user_id: newUser.id,
        username: newUser.username,
        aptos_address: newUser.aptos_address,
        email: newUser.email || null,
        referred_by: newUser.referred_by || 'none',
        referral_code: newUser.referral_code,
      });

      return newUser;
    } catch (error) {
      console.log(`[${timestamp}] 💥 REGISTRATION ERROR:`, {
        username: createUserDto.username,
        aptos_address: createUserDto.aptos_address,
        error_type: error instanceof Error ? error.constructor.name : 'unknown',
        error_message: error instanceof Error ? error.message : String(error),
        error_status:
          typeof error === 'object' && error && 'status' in error
            ? String((error as { status: unknown }).status)
            : 'unknown',
      });

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
