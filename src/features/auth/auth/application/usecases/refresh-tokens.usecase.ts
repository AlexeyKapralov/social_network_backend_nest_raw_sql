import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { InterlayerNotice, InterLayerStatuses } from '../../../../../base/models/interlayer';
import { ApiSettings } from '../../../../../settings/env/api-settings';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from '../../../../../settings/env/configuration';
import ms from 'ms';
import { RefreshTokenPayloadDto } from '../../../../../common/dto/refresh-token-payload.dto';
import { DeviceService } from '../../../devices/application/device.service';
import { DeviceQueryRepository } from '../../../devices/infrastructure/device-query.repository';
import { AuthService } from '../auth.service';


export class RefreshTokensCommand implements ICommand {
    constructor(
        public refreshTokenPayload: RefreshTokenPayloadDto,
    ) {}
}

@CommandHandler(RefreshTokensCommand)
export class RefreshTokensUseCase implements ICommandHandler<
    RefreshTokensCommand,
    InterlayerNotice<RefreshTokensUseCaseResultType>
> {
    constructor(
        private deviceService: DeviceService,
        private configService: ConfigService<ConfigurationType>,
        private authService: AuthService,
        private deviceQueryRepository: DeviceQueryRepository,
    ) {
    }

    async execute(command: RefreshTokensCommand): Promise<InterlayerNotice<RefreshTokensUseCaseResultType>> {
        const notice = new InterlayerNotice<RefreshTokensUseCaseResultType>;

        const dateNow = Date.now()
        const checkIat = command.refreshTokenPayload.iat

        const apiSettings = this.configService.get<ApiSettings>('apiSettings')
        const rtExpLive = apiSettings.REFRESH_TOKEN_EXPIRATION_LIVE
        const atExpLive = apiSettings.ACCESS_TOKEN_EXPIRATION_LIVE
        const newExpRt = Math.round( ( dateNow + ms(rtExpLive) ) / 1000)
        const newExpAt = Math.round( ( dateNow + ms(atExpLive) ) / 1000)
        const newIat = Math.round( dateNow  / 1000)

        const deviceId = command.refreshTokenPayload.deviceId;

        const checkDeviceExpirationInterLayer = await this.deviceService.checkDeviceExpiration(deviceId, checkIat);
        if (checkDeviceExpirationInterLayer.hasError()) {
            notice.addError('device was expired', 'device', InterLayerStatuses.FORBIDDEN);
            return notice
        }

        const userId = await this.deviceQueryRepository.findUserIdOfDevice(deviceId);
        if (!userId) {
            notice.addError('usedId by deviceId was not found', 'usedId', InterLayerStatuses.NOT_FOUND);
            return notice
        }

        const isUpdateDeviceInterlayer = await this.deviceService.updateDevice(deviceId, newIat, newExpRt);
        if (isUpdateDeviceInterlayer.hasError()) {
            notice.addError('device was not updated', 'device', InterLayerStatuses.FORBIDDEN);
            return notice
        }

        // const payload = new FindDeviceQueryPayload(deviceId)
        // const deviceInterLayer = await this.queryBus.execute<
        //     FindDeviceQueryPayload,
        //     InterlayerNotice<DeviceViewDto>
        // >(payload)
        // if (deviceInterLayer.hasError()) {
        //     throw new UnauthorizedException()
        // }

        // const apiSettings = this.configService.get<ApiSettings>('apiSettings');
        // const atLive = apiSettings.ACCESS_TOKEN_EXPIRATION_LIVE
        // const rtLive = apiSettings.REFRESH_TOKEN_EXPIRATION_LIVE
        const tokens = await this.authService.createTokens(userId, deviceId, newIat, newExpAt, newExpRt);

        notice.addData(tokens)

        return notice;
    }
}

export type RefreshTokensUseCaseResultType = {
    accessToken: string
    refreshToken: string
}