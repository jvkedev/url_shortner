import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { User } from '../../user/schemas/user.schema';

export type UrlDocument = HydratedDocument<Url>;

@Schema({ timestamps: true })
export class Url {
  @Prop({ required: true })
  originalUrl!: string;

  @Prop({ required: true, unique: true })
  shortCode!: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  owner!: Types.ObjectId;

  @Prop({ default: 0 })
  clicks!: number;

  @Prop({ default: null })
  lastVisitedAt?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const UrlSchema = SchemaFactory.createForClass(Url);
