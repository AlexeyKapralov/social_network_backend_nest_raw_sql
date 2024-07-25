import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { DeviceRepository } from '../../../devices/infrastructure/device.repository';
import { InterlayerNotice, InterLayerStatuses } from '../../../../../base/models/interlayer';


export class CreateDeviceCommand implements ICommand {
    constructor(
        public userId: string,
        public ip: string,
        public deviceName: string,
        public exp: number,
        public iat: number,
    ) {
    }
}

@CommandHandler(CreateDeviceCommand)
export class CreateDeviceUseCase implements ICommandHandler<
    CreateDeviceCommand,
    InterlayerNotice<CreateDeviceResultType>
> {
    constructor(
        private deviceRepository: DeviceRepository,
    ) {
    }

    async execute(command: CreateDeviceCommand): Promise<InterlayerNotice<CreateDeviceResultType>> {
        const notice = new InterlayerNotice<CreateDeviceResultType>;

        const device = await this.deviceRepository.createOrUpdateDevice(
            command.userId,
            command.ip,
            command.deviceName,
            command.exp,
            command.iat,
        );

        if (!device) {
            notice.addError('device was not found', 'device', InterLayerStatuses.NOT_FOUND);
            return notice
        }

        notice.addData({
            deviceId: device.id,
            iat: device.iat,
            exp: device.exp,
        });

        return notice;
    }
}

export type CreateDeviceResultType = {
    deviceId: string,
    exp: number
    iat: number
}