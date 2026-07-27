import { Injectable } from '@nestjs/common';

@Injectable()
export class UrlService {
  private readonly ALPHABET =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  private generateShortCode(length: number): string {
    let shortCode = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * this.ALPHABET.length);

      shortCode += this.ALPHABET[randomIndex];
    }
    return shortCode;
  }
}
