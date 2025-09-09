import { Module } from '@nestjs/common';
import { MaillerService } from './mailler.service';
import { MaillerController } from './mailler.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import {config } from 'dotenv';
config

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 465,
        ignoreTLS: true,
        secure: true,
        auth: {
          user: 'picmi77@gmail.com', // Your email address
          pass: 'qjvlcarymdgznsfv'
        },
      },
      defaults: {
        from: `"E-Commerce Platform" <${process.env.MAILER_USER}>`,
      },
    })
  ],
  providers: [MaillerService],
  controllers: [MaillerController],
  exports: [MaillerService] // Export so other modules can use it
})
export class MaillerModule {}
