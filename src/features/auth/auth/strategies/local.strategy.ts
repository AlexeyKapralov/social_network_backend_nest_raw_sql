import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy } from 'passport-local';
import { AuthService } from '../application/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly authService: AuthService) {
        super({
            usernameField: 'loginOrEmail',
            passwordField: 'password'
        });
    }

    async validate(username: string, password: string): Promise<any> {

        const user = await this.authService.authUser({password: password, loginOrEmail: username})

        if (!user) {
            throw new UnauthorizedException();
        }

        return {
            id: user
        }
    }
}