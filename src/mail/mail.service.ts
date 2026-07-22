import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationEmail(
    email: string,
    verificationToken: string,
  ): Promise<void> {
    const verificationUrl = `http://localhost:5000/auth/verify-email?token=${verificationToken}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify your email',
      html: `
        <h1>Welcome!</h1>
         <p>Please verify your email by clicking the link below.</p>
         <a href="${verificationUrl}">
            Verifiy Email
         </a>
      `,
    });
  }
}
