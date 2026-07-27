import { Post, Controller, UseGuards, Body } from '@nestjs/common';
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
}
