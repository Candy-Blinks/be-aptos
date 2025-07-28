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

@Controller('users')
@UseGuards(ApiKeyGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('check-username')
  async checkUsernameAvailability(@Query('username') username: string) {
    if (!username) {
      throw new Error('Username query parameter is required');
    }

    return this.usersService.checkUsernameAvailability(username);
  }

  @Get('check-aptos-address')
  async checkAptosAddressAvailability(
    @Query('aptos_address') aptosAddress: string,
  ) {
    if (!aptosAddress) {
      throw new Error('Aptos address query parameter is required');
    }

    return this.usersService.checkAptosAddressAvailability(aptosAddress);
  }

  @Get('check-availability')
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
  async checkReferralCode(@Query('referral_code') referralCode: string) {
    if (!referralCode) {
      throw new Error('referral_code query parameter is required');
    }

    return this.usersService.checkReferralCodeExists(referralCode);
  }

  @Get('referral-code')
  async getUserReferralCode(@Query('aptos_address') aptosAddress: string) {
    if (!aptosAddress) {
      throw new Error('aptos_address query parameter is required');
    }

    return this.usersService.getUserReferralCode(aptosAddress);
  }

  @Get('check-email')
  async checkEmailAvailability(@Query('email') email: string) {
    if (!email) {
      throw new Error('Email query parameter is required');
    }

    return this.usersService.checkEmailAvailability(email);
  }

  @Post('register')
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
  async findAll(@Query('skip') skip?: string, @Query('take') take?: string) {
    const skipNum = skip ? parseInt(skip, 10) : undefined;
    const takeNum = take ? parseInt(take, 10) : undefined;

    return this.usersService.findAll(skipNum, takeNum);
  }

  @Get('username/:username')
  async findByUsername(@Param('username') username: string) {
    if (!username) {
      throw new Error('Username parameter is required');
    }

    return this.usersService.findByUsername(username);
  }

  @Get('address/:address')
  async findByAptosAddress(@Param('address') aptosAddress: string) {
    if (!aptosAddress) {
      throw new Error('Aptos address parameter is required');
    }
    return this.usersService.findByAptosAddress(aptosAddress);
  }

  @Get('referral-stats')
  async getReferralStats(@Query('aptos_address') aptosAddress: string) {
    if (!aptosAddress) {
      throw new Error('aptos_address query parameter is required');
    }
    return this.usersService.getReferralStats(aptosAddress);
  }

  @Post('increment-points')
  async incrementPoints(
    @Body(ValidationPipe) updatePointsDto: UpdatePointsDto,
  ) {
    return this.usersService.incrementPoints(updatePointsDto);
  }

  @Post('decrement-points')
  async decrementPoints(
    @Body(ValidationPipe) updatePointsDto: UpdatePointsDto,
  ) {
    return this.usersService.decrementPoints(updatePointsDto);
  }

  @Post('upload-profile-picture')
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
  async getUserProfile(@Param('address') aptosAddress: string) {
    if (!aptosAddress) {
      throw new Error('Aptos address parameter is required');
    }

    return this.usersService.getUserProfile(aptosAddress);
  }
}
