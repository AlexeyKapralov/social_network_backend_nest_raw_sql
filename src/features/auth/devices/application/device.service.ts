import { Injectable } from '@nestjs/common';
import { DeviceDocument, DeviceDocumentSql } from '../domain/device.entity';
import { InterlayerNotice, InterLayerStatuses } from '../../../../base/models/interlayer';
import { DeviceRepository } from '../infrastructure/device.repository';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DeviceService {
    constructor(
        private readonly deviceRepository: DeviceRepository,
    ) {}

    /*
    * обновить время жизни токена
    * @param iat - новое время начала токена (ISO date string)
    * */
    async updateDevice(deviceId: string, iat: number, exp: number) {
        const notice = new InterlayerNotice()

        const device: DeviceDocumentSql = await this.deviceRepository.findDeviceById(deviceId)
        if (!device) {
            notice.addError('device not found', 'device', InterLayerStatuses.NOT_FOUND)
            return notice
        }
        if (device.exp <= Math.round( Date.now() / 1000 ) ) {
            notice.addError('device already was expired', 'device', InterLayerStatuses.FORBIDDEN)
            return notice
        }
        await this.deviceRepository.updateDeviceLive(deviceId, exp, iat)

        return notice
    }

    async setDeviceExpired(deviceId: string)
    {
        const notice = new InterlayerNotice()
        const isSet = await this.deviceRepository.setDeviceExpired(deviceId)

        if (!isSet) notice.addError('device expired did not set', 'device', InterLayerStatuses.NOT_FOUND)

        return notice
    }

    /*
    * проверка на то, валидный ли девайс
    * @param {string} deviceId - objectId в строке
    * @param {number} iat - дата в секундах
    * */
    async checkDeviceExpiration(deviceId: string, iat: number) {
        const notice = new InterlayerNotice()

        const device = await this.deviceRepository.findDeviceByIdAndIat(deviceId, iat)

        if (!device) {
            notice.addError('device not found', 'device', InterLayerStatuses.NOT_FOUND);
        }

        return notice
    }

    async deleteOtherDevices(deviceId: string ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice()

        const deletedDevice = await this.deviceRepository.deleteOtherDevices(deviceId)

        if (!deletedDevice) {
            notice.addError('device was not deleted', 'device', InterLayerStatuses.NOT_FOUND)
        }
        return notice
    }

    async deleteDevice( deviceId: string, userId: string ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice()

        const isUserOwnerDevice = await this.deviceRepository.checkDeviceOwner(deviceId, userId)
        if (!isUserOwnerDevice) {
            notice.addError('user is not owner', 'user', InterLayerStatuses.FORBIDDEN)
            return notice
        }

        const deletedDevice = await this.deviceRepository.deleteDevice(deviceId, userId)
        if (!deletedDevice) {
            notice.addError('devices was not deleted', 'device', InterLayerStatuses.NOT_FOUND)
            return notice
        }

        return notice
    }
}