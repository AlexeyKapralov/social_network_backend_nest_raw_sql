import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BasicStrategy as Strategy } from 'passport-http';
import { ConfigService } from '@nestjs/config';
import { ApiSettings } from '../../../../settings/env/api-settings';

@Injectable()
export class BasicStrategy extends PassportStrategy(Strategy){
    constructor(
        private readonly configService:ConfigService,
    ) {
        super();
    }


    async validate(username: string, password: string) {
        const apiSettings = this.configService.get<ApiSettings>('apiSettings', {infer: true})
        const adminName = apiSettings.ADMIN_USERNAME
        const adminPassword = apiSettings.ADMIN_PASSWORD

        if (
            username === adminName && password === adminPassword
        ) {
            return true
        }
        throw new UnauthorizedException();
    }
}