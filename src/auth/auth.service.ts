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

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  private async generateAccessToken(user: {
    _id: { toString(): string };
  }): Promise<{ accessToken: string }> {
    const payload = {
      sub: user._id.toString(),
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
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

      return this.generateAccessToken(user);
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
}
