import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateUrlDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(2048)
  originalUrl!: string;
}
