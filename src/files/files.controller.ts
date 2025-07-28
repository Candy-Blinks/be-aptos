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

@Controller('files')
@UseGuards(ApiKeyGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload-single')
  @UseInterceptors(FileInterceptor('file'))
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
    console.log('Upload request received:', {
      originalName: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
      hasBuffer: !!file?.buffer,
      hasPath: !!file?.path,
      folder,
    });

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
