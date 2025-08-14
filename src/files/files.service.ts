import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class FilesService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'posts',
  ): Promise<string> {
    try {
      let uploadSource: string;

      // Handle different file sources
      if (file.path) {
        // File uploaded to disk (has file path)
        uploadSource = file.path;
      } else if (file.buffer) {
        // File uploaded to memory (has buffer) - convert to data URI
        uploadSource = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      } else {
        throw new Error('No file data available');
      }

      const result = await cloudinary.uploader.upload(uploadSource, {
        folder: `social-media/${folder}`,
        resource_type: 'image',
        format: 'webp',
        quality: 'auto',
        fetch_format: 'auto',
      });

      return result.secure_url;
    } catch (error) {
      throw new Error(
        `Failed to upload image to Cloudinary: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = 'posts',
  ): Promise<string[]> {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadImage(file, folder),
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      throw new Error(
        `Failed to upload images: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new Error(
        `Failed to delete image: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  extractPublicId(url: string): string {
    // Extract public ID from Cloudinary URL
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    return fileName.split('.')[0];
  }
}
