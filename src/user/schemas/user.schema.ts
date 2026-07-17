import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ required: true, minLength: 2, maxLength: 100, trim: true })
  name!: string;

  @Prop({
    required: true,
    maxLength: 255,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  @Prop({ required: true, minLength: 6, maxLength: 60, select: false })
  password!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
