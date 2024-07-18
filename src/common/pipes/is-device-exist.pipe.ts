import { ArgumentMetadata, Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { DeviceRepository } from '../../features/auth/devices/infrastructure/device.repository';

@Injectable()
/*
* проверка существования юзера по userId
* */
export class IsDeviceExistPipe implements PipeTransform<string, Promise<string>> {
    constructor(private readonly deviceRepository: DeviceRepository) {}

    async transform(value: string, metadata: ArgumentMetadata): Promise<string> {
        let device = null
        try {
            device = await this.deviceRepository.findDeviceById(value)
        } catch {
            throw new NotFoundException('Device was not found');
        }
        if (!device) throw new NotFoundException('Device was not found');
        return value
    }


}