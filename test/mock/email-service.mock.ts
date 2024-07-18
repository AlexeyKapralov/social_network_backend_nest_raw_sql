import { EmailService } from '../../src/base/services/email.service';

export class EmailServiceMock extends EmailService {
    sendConfirmationCode (email: string, subject: string, html: string) {
        console.log('sendConfirmationCode mock was run');
        return
    }
}