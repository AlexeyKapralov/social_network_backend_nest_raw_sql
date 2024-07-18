import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { ApiSettings } from '../../settings/env/api-settings';

@Injectable()
export class EmailService {
    constructor(
        private readonly configService: ConfigService,
    ) {}

    sendConfirmationCode (email: string, subject: string, html: string) {
        const apiSettings = this.configService.get<ApiSettings>('apiSettings', {infer: true})
        const userLogin = apiSettings.USER_EMAIL_LOGIN
        const userPassword = apiSettings.USER_EMAIL_PASSWORD
        let transport = nodemailer.createTransport({
                service: 'gmail',
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: userLogin,
                    pass: userPassword
                }
            }
        )

        transport.sendMail({
            from: `"Alexey" <alewka24@gmail.com>`,
            to: email,
            subject,
            html,
        }).then(console.info).catch(console.error)
    }
}