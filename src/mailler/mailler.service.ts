import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MaillerService {
    constructor(private mailerService: MailerService) {}

    // Simple email sending method
    async sendEmail(to: string, subject: string, message: string) {
        try {
            await this.mailerService.sendMail({
                to: to,
                subject: subject,
                text: message,
                html: `<p>${message}</p>`,
            });
            return { success: true, message: 'Email sent successfully' };
        } catch (error) {
            console.error('Email sending failed:', error);
            throw new Error('Failed to send email');
        }
    }

    // Send welcome email
    async sendWelcomeEmail(email: string, username: string) {
        const subject = 'Welcome to Our Platform!';
        const message = `Hello ${username}! Welcome to our e-commerce platform. Thank you for joining us!`;
        return await this.sendEmail(email, subject, message);
    }

    // Send test email
    async sendTestEmail(email: string) {
        const subject = 'Test Email';
        const message = 'This is a test email. Your email system is working!';
        return await this.sendEmail(email, subject, message);
    }
}

