import {
  Post,
  Get,
  Controller,
  UseGuards,
  Body,
  Redirect,
  Param,
} from '@nestjs/common';
import { UrlService } from './url.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreateUrlDto } from './dto/create-url.dto';
import { User as CurrentUser } from '../auth/decorators/user.decorator';
import type { UserDocument } from '../user/schemas/user.schema';

@Controller('url')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Body() createUrlDto: CreateUrlDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.urlService.create(createUrlDto, user._id);
  }

  @Get(':shortCode')
  @Redirect()
  async redirectToOriginalUrl(@Param('shortCode') shortCode: string) {
    const originalUrl = await this.urlService.resolveShortUrl(shortCode);
    return {
      url: originalUrl,
    };
  }
}

// TODO: Move this endpoint to the application root (GET /:shortCode)
// so shortened URLs become http://domain.com/abc123 instead of
// http://domain.com/url/abc123.
