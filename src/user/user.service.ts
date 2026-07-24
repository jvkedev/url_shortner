import { BadRequestException, Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(registerUserDto: RegisterUserDto) {
    return await this.userModel.create(registerUserDto);
  }

  async findByEmail(email: string) {
    return await this.userModel.findOne({ email }).select('+password');
  }

  async verifyEmail(id: string) {
    return await this.userModel.findByIdAndUpdate(
      id,
      {
        isVerified: true,
      },
      {
        returnDocument: 'after',
      },
    );
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { refreshToken },
      {
        returnDocument: 'after',
      },
    );
  }

  findAll() {
    return `This action returns all user`;
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user id');
    }

    return await this.userModel.findById(id);
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
