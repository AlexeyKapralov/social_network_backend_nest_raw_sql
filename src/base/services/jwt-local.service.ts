import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from '../../settings/env/configuration';
import { readableStreamLikeToAsyncGenerator } from 'rxjs/internal/util/isReadableStreamLike';

@Injectable()
export class JwtLocalService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService<ConfigurationType>
    ) {}

    async parseJwtToken(tokenFromHeaders: string): Promise<string | null> {

        const apiSettings = this.configService.get( 'apiSettings', {infer: true} )

        try{
            const token = tokenFromHeaders.split(' ')[1]

            const jwtFull =  await this.jwtService.verifyAsync(
                token,
                {
                    secret: apiSettings.SECRET
                }
            )
            return jwtFull.userId
        } catch (e) {
            return null
        }

    }
}