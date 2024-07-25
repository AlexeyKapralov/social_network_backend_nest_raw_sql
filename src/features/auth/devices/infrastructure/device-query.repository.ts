import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Device, DeviceModelType } from '../domain/device.entity';
import { DeviceViewDto } from '../api/dto/output/device-view.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DeviceQueryRepository {
    constructor(
        @InjectDataSource() private dataSource: DataSource,
    ) {}

    async findUserIdOfDevice(
        deviceId: string
    ): Promise<string>
    {
        try {
            const device = await this.dataSource.query(`
                SELECT 
                    "userId"
                FROM public.devices
                WHERE id = $1
            `,
                [deviceId],
            );
            return device[0].userId
        } catch {
            return null
        }
    }

    async findAllDevices( deviceId: string ): Promise<DeviceViewDto[]> {
        try {
            const devices = await this.dataSource.query(
                `
                SELECT 
                    d.ip,
                    d."deviceName" AS title,
                    d.iat AT TIME ZONE 'UTC' AS "lastActiveDate",
                    d.id AS "deviceId"
                FROM public.devices d
                INNER JOIN (
                    SELECT 
                        d2."userId"
                    FROM public.devices d2
                    WHERE 
                        d2.id = $1 AND 
                        d2.exp AT TIME ZONE 'UTC' > $2
                ) AS d2 ON d2."userId" = d."userId"
                WHERE d.exp AT TIME ZONE 'UTC' > $2
            `,
                [deviceId, new Date()],
            )
            return devices
        } catch {}
    }
}