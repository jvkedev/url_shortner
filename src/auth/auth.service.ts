import { ConflictException, Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';

import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.userService.findByEmail(
      createUserDto.email,
    );

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    try {
      const hash = await bcrypt.hash(createUserDto.password, 10);
      return await this.userService.create({
        ...createUserDto,
        password: hash,
      });
    } catch (error: unknown) {
      const e = error as { code?: number };

      const DUPLICATION_KEY_ERROR = e;

      if (e.code === DUPLICATION_KEY_ERROR) {
        throw new ConflictException('Email is already registered');
      }
    }
  }
}
