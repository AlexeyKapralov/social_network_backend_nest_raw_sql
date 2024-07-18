import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Device, DeviceDocument, DeviceModelType } from '../domain/device.entity';

@Injectable()
export class DeviceRepository {
    constructor(
        @InjectModel(Device.name) private readonly deviceModel: DeviceModelType,
    ) {
    }

    /*
    * создаст новый девайс либо обновит даты (exp, iat) для старого
    */
    async createOrUpdateDevice(
        userId: string,
        ip: string,
        deviceName: string,
        exp: number,
        iat: number
    ) {
        let device = await this.findDevice(
            userId,
            ip,
            deviceName
        );

        if (!device) {
            device = this.deviceModel.createDevice(
                userId,
                ip,
                deviceName,
                exp,
                iat,
            )
            await device.save()

            return device
        }

        return this.updateDeviceLive(device._id.toString(), exp, iat)
    }

    async findDevice(
        userId: string,
        ip: string,
        deviceName: string,
    ): Promise<DeviceDocument>
    {
        return this.deviceModel.findOne({
            userId: userId,
            ip: ip,
            deviceName: deviceName,
        })
    }

    async findDeviceByIdAndIat(
        deviceId: string,
        iat: number
    ): Promise<DeviceDocument>
    {
        const device = await this.deviceModel.findOne({
            _id: deviceId,
            iat
        })
        if ( !device ||  ( device.exp <= Math.round( Date.now() / 1000) ) ) {
            return null
        }
        return device
    }

    async findDeviceById(
        deviceId: string
    )
    {
        return this.deviceModel.findOne({
            _id: deviceId
        });
    }

    /*
    * @param iat - ISO Date from seconds
    * @param exp - ISO Date from seconds
    * */
    async updateDeviceLive(deviceId: string, exp: number, iat: number) {

        return this.deviceModel.findOneAndUpdate(
            {_id: deviceId},
            {iat: iat, exp: exp}
        )
    }

    async setDeviceExpired (deviceId: string): Promise<boolean> {
        const isUpdated = await this.deviceModel.updateOne(
            { _id: deviceId },
            { exp: Math.round( Date.now() / 1000) }
        )

        return isUpdated.modifiedCount > 0
    }

    async checkDeviceOwner (deviceId: string, userId: string): Promise<boolean> {
        const device = await this.deviceModel.findOne(
            { _id: deviceId, exp: { $gt: Math.round( Date.now() / 1000) } }
        )
        if (!device) return false

        return device.userId === userId
    }

    async deleteOtherDevices(deviceId: string ): Promise<boolean> {
        const device = await this.deviceModel.findOne(
            { _id: deviceId, exp: { $gt: Math.round( Date.now() / 1000) }
            })

        const isDeleted = await this.deviceModel.updateMany(
            {
                _id: { $ne: deviceId },
                userId: device.userId,
                exp: { $gt: Math.round( Date.now() / 1000) }},
            {
                exp: Math.round( Date.now() / 1000)
            }
        ).exec()
        return isDeleted.modifiedCount > 0
    }

    async deleteDevice( deviceId: string, userId: string ): Promise<boolean> {
        const isDeleted = await this.deviceModel.updateOne(
            { _id: deviceId, exp: { $gt: Math.round( Date.now() / 1000) }, userId },
            { exp: Math.round( Date.now() / 1000) }
        )

        return isDeleted.modifiedCount > 0
    }

}