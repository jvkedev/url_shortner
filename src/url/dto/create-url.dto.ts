import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateUrlDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(2048)
  originalUrl!: string;
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
