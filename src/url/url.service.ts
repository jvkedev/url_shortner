import {
  ConflictException,
  GoneException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Url } from './schemas/url.schema';
import { Model, Types } from 'mongoose';
import { CreateUrlDto } from './dto/create-url.dto';
import { UrlResponseDto } from './dto/url-response.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { RedisService } from '../redis/redis.service';
import { CACHE_TTL } from '../common/constants/app.constants';

@Injectable()
export class UrlService {
  private readonly logger = new Logger(UrlService.name);
  constructor(
    @InjectModel(Url.name) private readonly urlModel: Model<Url>,
    private readonly redisService: RedisService,
  ) {}

  private readonly ALPHABET =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  private readonly MAX_RETRIES = 5;

  private readonly RESERVED_ALIAS = [
    'login',
    'register',
    'admin',
    'api',
    'health',
  ];

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

  private updateUrlAnalytics(shortCode: string) {
    void this.urlModel
      .updateOne(
        { shortCode },
        {
          $inc: { clicks: 1 },
          $set: { lastVisitedAt: new Date() },
        },
      )
      .catch((error) => {
        this.logger.error(`Failed to update analytics for ${shortCode}`, error);
      });
  }

  async create(
    createUrlDto: CreateUrlDto,
    userId: Types.ObjectId,
  ): Promise<UrlResponseDto> {
    let shortCode: string;
    const customAlias = createUrlDto.customAlias;

    if (customAlias) {
      if (this.RESERVED_ALIAS.includes(customAlias)) {
        throw new ConflictException('This alias is reserved');
      }

      const exists = await this.shortCodeExists(customAlias);

      if (exists) {
        throw new ConflictException('Custom alias already exists');
      }

      shortCode = customAlias;
    } else {
      shortCode = await this.generateUniqueShortCode();
    }

    const url = await this.urlModel.create({
      originalUrl: createUrlDto.originalUrl,
      shortCode,
      owner: userId,
      expiresAt: createUrlDto.expiresAt,
    });

    return {
      id: url.id,
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      clicks: url.clicks,
      createdAt: url.createdAt,
      updatedAt: url.updatedAt,
    };
  }

  async resolveShortUrl(shortCode: string) {
    const cachedUrl = await this.redisService.get(`url:${shortCode}`);

    if (cachedUrl) {
      this.updateUrlAnalytics(shortCode);
      return cachedUrl;
    }

    this.logger.log('Fetching URL from Mongodb');
    const url = await this.urlModel.findOne({ shortCode });

    if (!url) {
      throw new NotFoundException('Url not found');
    }

    if (url?.expiresAt && url?.expiresAt < new Date()) {
      throw new GoneException('Url has expired');
    }

    this.updateUrlAnalytics(shortCode);

    await this.redisService.set(
      `url:${shortCode}`,
      url.originalUrl,
      String(CACHE_TTL.URL),
    );

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
      updatedAt: url.updatedAt,
    }));
  }

  async updateUserUrl(_id: string, owner: string, updateUrlDto: UpdateUrlDto) {
    const url = await this.urlModel.findOneAndUpdate(
      {
        _id,
        owner,
      },
      {
        originalUrl: updateUrlDto.originalUrl,
      },
      {
        returnDocument: 'after',
      },
    );

    if (!url) {
      throw new NotFoundException('Url not found');
    }

    return {
      id: url.id,
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      clicks: url.clicks,
      createdAt: url.createdAt,
      updatedAt: url.updatedAt,
    };
  }

  async deleteUserUrl(_id: string, owner: string) {
    const deletedUrl = await this.urlModel.findOneAndDelete({
      _id,
      owner,
    });

    if (!deletedUrl) {
      throw new NotFoundException('Url not found');
    }

    return {
      message: 'Url deleted successfully',
    };
  }
}
