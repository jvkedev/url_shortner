import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateUrlDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  @MaxLength(2048)
  originalUrl!: string;
}
