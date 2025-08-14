import {
  Controller,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Query,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
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

@ApiTags('files')
@Controller('files')
@UseGuards(ApiKeyGuard)
@ApiSecurity('api-key')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload-single')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'folder',
    description: 'Folder to upload to (default: general)',
    example: 'posts',
    required: false,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'File to upload (max 10MB, supported: jpg, jpeg, png, webp, gif)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'File uploaded successfully',
    schema: {
      example: {
        success: true,
        url: 'https://res.cloudinary.com/example/image/upload/v1234567890/social-media/posts/image.jpg',
        message: 'File uploaded successfully',
        fileInfo: {
          originalName: 'image.jpg',
          size: 1024000,
          mimetype: 'image/jpeg',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file or upload failed' })
  async uploadSingle(
    @Query('folder') folder: string = 'general',
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp|gif)$/ }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      const url = await this.filesService.uploadImage(file, folder);
      return {
        success: true,
        url,
        message: 'File uploaded successfully',
        fileInfo: {
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Upload failed: ${errorMessage}`);
    }
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'folder',
    description: 'Folder to upload to (default: general)',
    example: 'posts',
    required: false,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description:
            'Files to upload (max 10 files, 5MB each, supported: jpg, jpeg, png, webp, gif)',
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Files uploaded successfully',
    schema: {
      example: {
        success: true,
        urls: [
          'https://res.cloudinary.com/example/image/upload/v1234567890/social-media/posts/image1.jpg',
          'https://res.cloudinary.com/example/image/upload/v1234567890/social-media/posts/image2.jpg',
        ],
        count: 2,
        message: '2 files uploaded successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid files or upload failed' })
  async uploadMultiple(
    @Query('folder') folder: string = 'general',
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB per file
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp|gif)$/ }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > 10) {
      throw new BadRequestException('Maximum 10 files allowed');
    }

    try {
      const urls = await this.filesService.uploadMultipleImages(files, folder);
      return {
        success: true,
        urls,
        count: urls.length,
        message: `${urls.length} files uploaded successfully`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Upload failed: ${errorMessage}`);
    }
  }

  @Delete('delete/:publicId')
  @ApiOperation({ summary: 'Delete a file by public ID' })
  @ApiParam({
    name: 'publicId',
    description: 'Cloudinary public ID of the file to delete',
    example: 'social-media/posts/image123',
  })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'File deleted successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Delete failed' })
  async deleteFile(@Param('publicId') publicId: string) {
    try {
      await this.filesService.deleteImage(publicId);
      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Delete failed: ${errorMessage}`);
    }
  }

  @Post('extract-public-id')
  @ApiOperation({ summary: 'Extract public ID from Cloudinary URL' })
  @ApiQuery({
    name: 'url',
    description: 'Cloudinary URL to extract public ID from',
    example:
      'https://res.cloudinary.com/example/image/upload/v1234567890/social-media/posts/image.jpg',
  })
  @ApiResponse({
    status: 200,
    description: 'Public ID extracted successfully',
    schema: {
      example: {
        success: true,
        publicId: 'social-media/posts/image',
        url: 'https://res.cloudinary.com/example/image/upload/v1234567890/social-media/posts/image.jpg',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Failed to extract public ID' })
  extractPublicId(@Query('url') url: string) {
    if (!url) {
      throw new BadRequestException('URL parameter is required');
    }

    try {
      const publicId = this.filesService.extractPublicId(url);
      return {
        success: true,
        publicId,
        url,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to extract public ID: ${errorMessage}`,
      );
    }
  }
}
