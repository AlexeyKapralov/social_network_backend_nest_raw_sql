import {
    Controller,
    Delete,
    ForbiddenException,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    UnauthorizedException,
} from '@nestjs/common';
import { Cookies } from '../../../../common/decorators/get-cookie.decorator';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenPayloadDto } from '../../../../common/dto/refresh-token-payload.dto';
import { DeviceService } from '../application/device.service';
import { DeviceQueryRepository } from '../infrastructure/device-query.repository';
import { IsDeviceExistPipe } from '../../../../common/pipes/is-device-exist.pipe';
import { DeviceRepository } from '../infrastructure/device.repository';
import { InterlayerNotice, InterLayerStatuses } from '../../../../base/models/interlayer';

@Controller('security')
export class DevicesController {
    constructor(
       private readonly jwtService: JwtService,
       private readonly deviceService: DeviceService,
       private readonly deviceQueryRepository: DeviceQueryRepository,
    ) {}

    @Get('devices')
    async getDevices(
        //todo переписать внутрь @Cookies засунуть pipe с доставанием токен payload и проверкой expired девайса
        @Cookies('refreshToken') refreshToken: string
    ) {
        let refreshTokenPayload: RefreshTokenPayloadDto
        try {
            refreshTokenPayload = this.jwtService.verify(refreshToken)
        } catch {
            throw new UnauthorizedException()
        }

        const checkDeviceInterlayer = await this.deviceService.checkDeviceExpiration(
            refreshTokenPayload.deviceId,
            refreshTokenPayload.iat
        )
        if (checkDeviceInterlayer.hasError()) throw new UnauthorizedException()


        return await this.deviceQueryRepository.findAllDevices(refreshTokenPayload.deviceId)
    }

    @Delete('devices')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteOtherDevices(
        //todo переписать внутрь @Cookies засунуть pipe с доставанием токен payload и проверкой expired девайса
        @Cookies('refreshToken') refreshToken: string
    ) {
        let refreshTokenPayload: RefreshTokenPayloadDto
        try {
            refreshTokenPayload = this.jwtService.verify(refreshToken)
        } catch {
            throw new UnauthorizedException()
        }

        const checkDeviceInterlayer = await this.deviceService.checkDeviceExpiration(
            refreshTokenPayload.deviceId,
            refreshTokenPayload.iat
        )
        if (checkDeviceInterlayer.hasError()) throw new UnauthorizedException()

        const isDeleted = await this.deviceService.deleteOtherDevices(refreshTokenPayload.deviceId)
        if (isDeleted.hasError()) throw new UnauthorizedException()
    }

    @Delete('devices/:deviceId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteDevice(
        //todo переписать внутрь @Cookies засунуть pipe с доставанием токен payload и проверкой expired девайса
        @Cookies('refreshToken') refreshToken: string,
        @Param('deviceId', IsDeviceExistPipe) deviceId: string
    ) {
        let refreshTokenPayload: RefreshTokenPayloadDto
        try {
            refreshTokenPayload = this.jwtService.verify(refreshToken)
        } catch {
            throw new UnauthorizedException()
        }

        const checkDeviceInterlayer = await this.deviceService.checkDeviceExpiration(
            refreshTokenPayload.deviceId,
            refreshTokenPayload.iat
        )
        if (checkDeviceInterlayer.hasError()) throw new UnauthorizedException()

        const userId = await this.deviceQueryRepository.findUserIdOfDevice(refreshTokenPayload.deviceId)

        let isDeleteDeviceInterLayer: InterlayerNotice = await this.deviceService.deleteDevice(deviceId, userId)

        if (isDeleteDeviceInterLayer.code === InterLayerStatuses.FORBIDDEN) throw new ForbiddenException()
        if (isDeleteDeviceInterLayer.code === InterLayerStatuses.NOT_FOUND) throw new NotFoundException()
    }
}