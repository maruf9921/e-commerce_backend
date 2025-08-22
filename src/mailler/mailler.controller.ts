import { Controller, Post, Body } from '@nestjs/common';
import { MaillerService } from './mailler.service';

@Controller('mailer')
export class MaillerController {
    constructor(private readonly maillerService: MaillerService) {}

    // Send test email
    @Post('test')
    async sendTestEmail(@Body('email') email: string) {
        if (!email) {
            return { error: 'Email is required' };
        }
        return await this.maillerService.sendTestEmail(email);
    }

    // Send custom email
    @Post('send')
    async sendEmail(
        @Body('email') email: string,
        @Body('subject') subject: string,
        @Body('message') message: string
    ) {
        if (!email || !subject || !message) {
            return { error: 'Email, subject, and message are required' };
        }
        return await this.maillerService.sendEmail(email, subject, message);
    }

    // Send welcome email
    @Post('welcome')
    async sendWelcomeEmail(
        @Body('email') email: string,
        @Body('username') username: string
    ) {
        if (!email || !username) {
            return { error: 'Email and username are required' };
        }
        return await this.maillerService.sendWelcomeEmail(email, username);
    }
}
