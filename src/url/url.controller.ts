import {
  Post,
  Get,
  Controller,
  UseGuards,
  Body,
  Redirect,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { UrlService } from './url.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreateUrlDto } from './dto/create-url.dto';
import { User as CurrentUser } from '../auth/decorators/user.decorator';
import type { UserDocument } from '../user/schemas/user.schema';
import { UpdateUrlDto } from './dto/update-url.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';

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

  @Get()
  @UseGuards(AuthGuard)
  getUserUrls(@CurrentUser() user: UserDocument) {
    return this.urlService.getUserUrls(user._id.toString());
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  updateUserUrl(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateUrlDto: UpdateUrlDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.urlService.updateUserUrl(id, user.id, updateUrlDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteUserUrl(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.urlService.deleteUserUrl(id, user.id);
  }
}

// TODO: Move this endpoint to the application root (GET /:shortCode)
// so shortened URLs become http://domain.com/abc123 instead of
// http://domain.com/url/abc123.
