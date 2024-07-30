import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from '../../../../settings/env/configuration';
import { DeviceService } from '../../devices/application/device.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService<ConfigurationType>,
        private readonly deviceService: DeviceService,
    ) {
        const apiSettings = configService.get('apiSettings', {infer: true})
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: apiSettings.SECRET
        })
    }
    //todo можно ли так или здесь проверять наличие девайса и прочие действия
    async checkDevice(payload: any) {
        console.log(`i'm here in checkDevicefrom fwt strategy`);
    }

    async validate(payload: any) {
        //todo можно ли так или здесь проверять наличие девайса и прочие действия
        await this.checkDevice(payload)
        return {
            id: payload.userId
        }
    }
}