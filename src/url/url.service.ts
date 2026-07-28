import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Url } from './schemas/url.schema';
import { Model, Types } from 'mongoose';
import { CreateUrlDto } from './dto/create-url.dto';
import { UrlResponseDto } from './dto/url-response.dto';

@Injectable()
export class UrlService {
  constructor(@InjectModel(Url.name) private urlModel: Model<Url>) {}

  private readonly ALPHABET =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  private readonly MAX_RETRIES = 5;

  private generateShortCode(length: number): string {
    let shortCode = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * this.ALPHABET.length);

      shortCode += this.ALPHABET[randomIndex];
    }
    return shortCode;
  }

  private async shortCodeExists(shortCode: string): Promise<boolean> {
    const exists = await this.urlModel.exists({ shortCode });

    return !!exists;
  }

  private async generateUniqueShortCode(): Promise<string> {
    for (let i = 0; i < this.MAX_RETRIES; i++) {
      const shortCode = this.generateShortCode(6);

      if (!(await this.shortCodeExists(shortCode))) {
        return shortCode;
      }
    }

    throw new InternalServerErrorException(
      'Failed to generate a unique short code',
    );
  }

  async create(
    createUrlDto: CreateUrlDto,
    userId: Types.ObjectId,
  ): Promise<UrlResponseDto> {
    const shortCode = await this.generateUniqueShortCode();

    const url = await this.urlModel.create({
      originalUrl: createUrlDto.originalUrl,
      shortCode,
      owner: userId,
    });

    return {
      id: url.id,
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      clicks: url.clicks,
      createdAt: url.createdAt,
    };
  }

  async resolveShortUrl(shortCode: string) {
    const url = await this.urlModel.findOneAndUpdate(
      { shortCode },
      {
        $inc: {
          clicks: 1,
        },
      },
      {
        returnDocument: 'after',
      },
    );

    if (!url) {
      throw new NotFoundException('Url not found');
    }

    return url.originalUrl;
  }

  async getUserUrls(owner: string): Promise<UrlResponseDto[]> {
    const urls = await this.urlModel.find({ owner });

    return urls.map((url) => ({
      id: url.id,
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      clicks: url.clicks,
      createdAt: url.createdAt,
    }));
  }
}
