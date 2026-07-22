import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

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
    private readonly mailService: MailService,
  ) {}

  private async generateAccessToken(user: {
    _id: { toString(): string };
  }): Promise<{ accessToken: string }> {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      type: 'access',
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  private async generateEmailVerificationToken(user: {
    _id: { toString(): string };
  }): Promise<{ verificationToken: string }> {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      type: 'email-verification',
    };

    return {
      verificationToken: await this.jwtService.signAsync(payload, {
        expiresIn: '15m',
      }),
    };
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

      const { verificationToken } =
        await this.generateEmailVerificationToken(user);

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

    return this.generateAccessToken(user);
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
}
