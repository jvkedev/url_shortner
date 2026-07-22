import { Logger, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerGuard } from '@nestjs/throttler';
import { MailerModule } from '@nestjs-modules/mailer';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Database (Mongodb) Module
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('mongodbUri'),
        connectionFactory: (connection: Connection): Connection => {
          const logger = new Logger('MongoDB');
          logger.log('MongoDB Connected Successfully');

          return connection;
        },
      }),
    }),

    // JWT Token
    JwtModule.registerAsync({
      inject: [ConfigService],
      global: true,
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('jwtSecret'),
        signOptions: {
          expiresIn: config.getOrThrow('jwtExpiresIn'),
        },
      }),
    }),

    // Mail Service
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.getOrThrow<string>('mailHost'),
          port: config.getOrThrow<number>('mailPort'),
          auth: {
            user: config.getOrThrow<string>('mailUser'),
            pass: config.getOrThrow<string>('mailPassword'),
          },
        },
        defaults: {
          from: config.getOrThrow<string>('mailFrom'),
        },
      }),
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            ttl: 60000,
            limit: 10,
          },
        ],
      }),
    }),

    UserModule,
    AuthModule,
    MailModule,
  ],

  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    AppService,
  ],
})
export class AppModule {}
