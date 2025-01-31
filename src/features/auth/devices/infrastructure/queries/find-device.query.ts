import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InterlayerNotice, InterLayerStatuses } from '../../../../../base/models/interlayer';
import { Paginator } from '../../../../../common/dto/paginator.dto';
import { DeviceViewDto } from '../../api/dto/output/device-view.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export class FindDeviceQueryPayload implements IQuery{
    constructor(
        public deviceId: string
    ) {}
}

@QueryHandler(FindDeviceQueryPayload)
export class FindDeviceQuery implements 
    IQueryHandler<
        FindDeviceQueryPayload,
        InterlayerNotice<FindDeviceQueryResultType>
    > 
{
    constructor(
        @InjectDataSource() private dataSource: DataSource
    ) {}

    async execute(query: FindDeviceQueryPayload): Promise<InterlayerNotice<FindDeviceQueryResultType>> {
        const notice = new InterlayerNotice<FindDeviceQueryResultType>()

        let device = null
        try {
            device = await this.dataSource.query(
                `
                SELECT 
                    "id" AS "deviceId",
                    "ip",
                    "title",
                    "iat" AS "lastActiveDate"
                FROM
                    public.devices
                WHERE 
                    "id" = $1
            `,
                [query.deviceId],
            );
            device = device[0];
        } catch {}

        if (!device) {
            notice.addError('device not found', 'device', InterLayerStatuses.NOT_FOUND)
            return notice
        }
        notice.addData(device.toObject())
        return notice
    }
}

export type FindDeviceQueryResultType  = Paginator<DeviceViewDto>