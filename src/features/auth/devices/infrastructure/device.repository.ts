import { Injectable } from '@nestjs/common';
import { DeviceDocument, DeviceDocumentSql } from '../domain/device.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DeviceRepository {
    constructor(
        @InjectDataSource() private dataSource: DataSource,
    ) {}

    /*
    * создаст новый девайс либо обновит даты (exp, iat - даты в секундах) для старого
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
            try {
                const device: DeviceDocumentSql[] = await this.dataSource.query(
                    `
                    INSERT INTO public.devices (
                        "deviceName", "userId", ip, exp, iat)
                        VALUES ($1, $2, $3, $4, $5)
                        RETURNING id, "deviceName", "userId", ip, exp, iat;
                `,
                    [deviceName, userId, ip, new Date(exp*1000).toISOString(), new Date(iat*1000).toISOString()],
                );
                return device[0];
            } catch {
                return null;
            }
        }
        return await this.updateDeviceLive(device.id, exp, iat)
    }

    async findDevice(
        userId: string,
        ip: string,
        deviceName: string,
    ): Promise<DeviceDocumentSql>
    {
        try {
            const device: DeviceDocumentSql[] = await this.dataSource.query(
                `
                SELECT 
                    id,
                    "userId",
                    ip, 
                    exp AT TIME ZONE 'UTC' AS ext,  
                    "deviceName",  
                    iat AT TIME ZONE 'UTC' AS iat
                FROM
                    public.devices
                WHERE
                    "userId" = $1 AND
                    ip = $2 AND
                    "deviceName" = $3
            `,
                [userId, ip, deviceName],
            );
            return device[0];
        } catch {
            return null
        }
    }

    async findDeviceByIdAndIat(
        deviceId: string,
        iat: number
    ): Promise<DeviceDocumentSql>
    {
        try {
            let devices: DeviceDocumentSql[] = await this.dataSource.query(
                `
                SELECT 
                    id,
                    "userId",
                    ip, 
                    exp AT TIME ZONE 'UTC' AS exp,  
                    "deviceName",  
                    iat AT TIME ZONE 'UTC' AS iat
                FROM
                    public.devices
                WHERE
                    id = $1 AND
                    DATE_TRUNC('seconds', iat) = $2
            `,
                [deviceId, new Date(iat*1000).toISOString()],
            );
            const device = devices[0];

            if (!device || (Number(new Date(device.exp)) <= Date.now())) {
                return null;
            }
            return device;
        } catch {
            return null
        }
    }

    async findDeviceById(
        deviceId: string
    ): Promise<DeviceDocumentSql>
    {
        try {
            const devices: DeviceDocumentSql[] = await this.dataSource.query(
                `
                SELECT
                    id,
                    "userId",
                    ip, 
                    exp AT TIME ZONE 'UTC' AS exp,  
                    "deviceName",  
                    iat AT TIME ZONE 'UTC' AS iat
                FROM
                    public.devices
                WHERE
                    id = $1
            `,
                [deviceId],
            );
            return devices[0];
        } catch {return null}
    }

    /*
    * @param iat - ISO Date from seconds
    * @param exp - ISO Date from seconds
    * */
    async updateDeviceLive(deviceId: string, exp: number, iat: number): Promise<DeviceDocumentSql> {
        try {
            const devices: [DeviceDocumentSql[], number] = await this.dataSource.query(`
            UPDATE public.devices
            SET exp=$2 AT TIME ZONE 'UTC', iat=$3 AT TIME ZONE 'UTC'
                WHERE id = $1
                RETURNING
                    id,
                    "userId",
                    ip,
                    exp AT TIME ZONE 'UTC' AS exp,
                    "deviceName",
                    iat AT TIME ZONE 'UTC' AS iat;
        `,
                [deviceId, new Date(exp * 1000), new Date(iat * 1000)],
            );
            if (devices[1] === 0) return null;
            return devices[0][0];
        } catch (e) {
            return null}
    }

    async setDeviceExpired (deviceId: string): Promise<boolean> {
        try {
            const isUpdated: [DeviceDocumentSql[], number] = await this.dataSource.query(`
            UPDATE public.devices
            SET exp = $2 AT TIME ZONE 'UTC'
                WHERE id = $1
                RETURNING
                    id,
                    "userId",
                    ip,
                    exp AT TIME ZONE 'UTC' AS exp,
                    "deviceName",
                    iat AT TIME ZONE 'UTC' AS iat;
        `,
                [deviceId, new Date().toISOString()],
            );

            return isUpdated[1] > 0;
        } catch {return null}
    }

    async checkDeviceOwner (deviceId: string, userId: string): Promise<boolean> {
        try {
            const devices: DeviceDocumentSql[] = await this.dataSource.query(
                `
                SELECT "userId", exp AT TIME ZONE 'UTC' AS exp
                FROM public.devices
                WHERE 
                    id = $1 
                    AND
                    exp AT TIME ZONE 'UTC' > $2
            `,
                [deviceId, new Date()],
            );
            if (devices.length === 0) return false;

            return devices[0].userId === userId;
        } catch (e) {
            console.log('devicePero: checkDeviceOwner is not work', e);
            console.log(e);
            return null}
    }

    async deleteOtherDevices(deviceId: string ): Promise<boolean> {
        let devices: DeviceDocumentSql[]
        try {
            devices = await this.dataSource.query(
                `
                SELECT "userId"
                FROM public.devices
                WHERE 
                    id = $1 AND
                    exp AT TIME ZONE 'UTC'  > $2
            `,
                [deviceId, new Date()],
            );
        } catch {
            return null
        }

        try {
            const isDeleted: [DeviceDocumentSql[], number] = await this.dataSource.query(`
            UPDATE public.devices
            SET exp = $2 AT TIME ZONE 'UTC'
                WHERE "userId" = $1 AND "id" <> $3
                RETURNING
                    id,
                    "userId",
                    ip,
                    exp AT TIME ZONE 'UTC' AS exp,
                    "deviceName",
                    iat AT TIME ZONE 'UTC' AS iat;
        `,
                [devices[0].userId, new Date(), deviceId],
            );
            return isDeleted[1] > 0;
        } catch (e) {
            console.log('deviceRepo/deleteOtherDevices not works', e);
            return null
        }
    }

    async deleteDevice( deviceId: string, userId: string ): Promise<boolean> {
        try {
            const isDeleted: [DeviceDocumentSql[], number] = await this.dataSource.query(`
            UPDATE public.devices
            SET exp = $2 AT TIME ZONE 'UTC'
                WHERE id = $1
                RETURNING
                    id,
                    "userId",
                    ip,
                    exp AT TIME ZONE 'UTC' AS exp,
                    "deviceName",
                    iat AT TIME ZONE 'UTC' AS iat;
        `,
                [deviceId, new Date().toISOString()],
            );

            return isDeleted[1] > 0;
        } catch (e) {
            return null
        }
    }

}