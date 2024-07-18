import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InterlayerNotice, InterLayerStatuses } from '../../../../../base/models/interlayer';
import { Paginator } from '../../../../../common/dto/paginator.dto';
import { DeviceViewDto } from '../../api/dto/output/device-view.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Device, DeviceModelType } from '../../domain/device.entity';

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
       @InjectModel(Device.name) private deviceModel: DeviceModelType
    ) {}

    async execute(query: FindDeviceQueryPayload): Promise<InterlayerNotice<FindDeviceQueryResultType>> {
        const notice = new InterlayerNotice<FindDeviceQueryResultType>()
        const device = await this.deviceModel.findOne(
            { _id: query.deviceId},
            {
                _id: 0,
                deviceId: '$id',
                ip: 1,
                title: 1,
                lastActiveDate: '$iat'
            }
        ).exec()

        if (!device) {
            notice.addError('device not found', 'device', InterLayerStatuses.NOT_FOUND)
            return notice
        }
        notice.addData(device.toObject())
        return notice
    }
}

export type FindDeviceQueryResultType  = Paginator<DeviceViewDto>