import { ConflictException, Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';

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

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.userService.findByEmail(
      createUserDto.email,
    );

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    try {
      const hash = await bcrypt.hash(createUserDto.password, 10);

      const user = await this.userService.create({
        ...createUserDto,
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
}
