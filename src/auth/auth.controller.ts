import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { RegisterUserDto } from '../user/dto/register-user.dto';
import { AuthService } from './auth.service';
import { LoginUserDto } from '../user/dto/login-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthGuard } from './guards/auth.guard';
import { User as CurrentUser } from './decorators/user.decorator';
import type { UserDocument } from '../user/schemas/user.schema';
import { UserResponseDto } from './dto/user-response.dto';
import { Throttle } from '@nestjs/throttler';
import { ONE_MINUTE, RATE_LIMITS } from '../common/constants/app.constants';

@Throttle({ default: { limit: RATE_LIMITS.AUTH, ttl: ONE_MINUTE } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('refresh')
  refresh(@Body() { refreshToken }: RefreshTokenDto) {
    return this.authService.refresh(refreshToken);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@CurrentUser() user: UserDocument): UserResponseDto {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
    };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@CurrentUser() user: UserDocument) {
    await this.authService.logout(user._id.toString());

    return {
      message: 'Logged out successfully',
    };
  }
}
