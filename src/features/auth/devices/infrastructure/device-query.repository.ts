import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Device, DeviceModelType } from '../domain/device.entity';
import { DeviceViewDto } from '../api/dto/output/device-view.dto';

@Injectable()
export class DeviceQueryRepository {
    constructor(
        @InjectModel(Device.name) private readonly deviceModel: DeviceModelType,
    ) {}

    async findUserIdOfDevice(
        deviceId: string
    )
    {
        const device = await this.deviceModel.findOne(
            { _id: deviceId },
            {_id: 0, userId: 1}
        );

        return device ? device.userId : null

    }

    async findAllDevices( deviceId: string ): Promise<DeviceViewDto[]> {
        const device = await this.deviceModel.findOne(
            { _id: deviceId, exp: { $gt: Math.round( Date.now() / 1000) }
        })

        return this.deviceModel.find(
            { userId: device.userId, exp: { $gt: Math.round( Date.now() / 1000) }},
            {
                _id: 0,
                ip: 1,
                title: '$deviceName',
                lastActiveDate: { $toDate: {$multiply: ['$iat', 1000]}},
                deviceId: '$_id'
            }
        ).lean()
    }
}