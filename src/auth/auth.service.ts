import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { randomUUID, createHash } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { UserService } from '../user/user.service';
import { RegisterUserDto } from '../user/dto/register-user.dto';
import { LoginUserDto } from '../user/dto/login-user.dto';
import { MailService } from '../mail/mail.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private async generateAccessToken(user: {
    _id: { toString(): string };
  }): Promise<string> {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      type: 'access',
    };

    return this.jwtService.signAsync(payload);
  }

  private async generateRefreshToken(user: {
    _id: { toString(): string };
  }): Promise<string> {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      type: 'refresh',
      jti: randomUUID(), // Unique ID ensures each token is different
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('jwtRefreshSecret'),
      expiresIn: this.configService.getOrThrow('jwtRefreshExpiresIn'),
    });
  }

  private async generateEmailVerificationToken(user: {
    _id: { toString(): string };
  }): Promise<string> {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      type: 'email-verification',
    };

    return this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });
  }

  async register(registerUserDto: RegisterUserDto) {
    const existingUser = await this.userService.findByEmail(
      registerUserDto.email,
    );

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    try {
      const hash = await bcrypt.hash(registerUserDto.password, 10);

      const user = await this.userService.create({
        ...registerUserDto,
        password: hash,
      });

      const verificationToken = await this.generateEmailVerificationToken(user);

      await this.mailService.sendVerificationEmail(
        user.email,
        verificationToken,
      );

      return {
        message: 'Register successful. Please verify your email',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
        },
      };
    } catch (error: unknown) {
      const e = error as { code?: number };

      const DUPLICATION_KEY_ERROR = 11000;

      if (e.code === DUPLICATION_KEY_ERROR) {
        throw new ConflictException('Email is already registered');
      }

      throw error;
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.userService.findByEmail(loginUserDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(loginUserDto.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    const hashedRefreshToken = createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await this.userService.updateRefreshToken(
      user._id.toString(),
      hashedRefreshToken,
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyEmail(token: string) {
    const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

    if (payload.type !== 'email-verification') {
      throw new UnauthorizedException('Invalid verification token');
    }

    const user = await this.userService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Invalid verification token');
    }

    if (user.isVerified) {
      throw new ConflictException('Email is already verified');
    }

    await this.userService.verifyEmail(user._id.toString());

    return {
      message: 'Email verified successfully.',
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow('jwtRefreshSecret'),
        },
      );

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token');
      }

      const user = await this.userService.findOne(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      if (!user.refreshToken) {
        throw new UnauthorizedException('Invalid token');
      }

      const incomingHash = createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      if (incomingHash !== user.refreshToken) {
        throw new UnauthorizedException('Invalid token');
      }

      const newAccessToken = await this.generateAccessToken(user);
      const newRefreshToken = await this.generateRefreshToken(user);

      const hashedRefreshToken = createHash('sha256')
        .update(newRefreshToken)
        .digest('hex');

      await this.userService.updateRefreshToken(
        user._id.toString(),
        hashedRefreshToken,
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
