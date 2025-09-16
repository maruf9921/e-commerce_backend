import { Module } from '@nestjs/common';
import { MaillerService } from './mailler.service';
import { MaillerController } from './mailler.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = {
          transport: {
            host: configService.get('SMTP_HOST', 'smtp.gmail.com'),
            port: parseInt(configService.get('SMTP_PORT', '587')),
            secure: configService.get('SMTP_SECURE', 'false') === 'true', // Use STARTTLS for port 587
            auth: {
              user: configService.get('SMTP_USER', 'picmi77@gmail.com'),
              pass: configService.get('SMTP_PASS', 'lrxorhxamhvofmsn')
            },
            tls: {
              rejectUnauthorized: false // Accept self-signed certificates in development
            }
          },
          defaults: {
            from: `"E-Commerce Platform" <${configService.get('SMTP_USER', 'picmi77@gmail.com')}>`,
          },
        };
        
        console.log('Mailer Config:', {
          host: config.transport.host,
          port: config.transport.port,
          secure: config.transport.secure,
          user: config.transport.auth.user,
          from: config.defaults.from
        });
        
        return config;
      }
    })
  ],
  providers: [MaillerService],
  controllers: [MaillerController],
  exports: [MaillerService] // Export so other modules can use it
})
export class MaillerModule {}
