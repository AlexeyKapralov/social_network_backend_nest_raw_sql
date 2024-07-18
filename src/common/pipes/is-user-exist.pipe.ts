import {
    ArgumentMetadata,
    Injectable,
    NotFoundException,
    PipeTransform,
} from '@nestjs/common';
import { UsersRepository } from '../../features/users/infrastructure/users.repository';

@Injectable()
/*
* проверка существования юзера по userId
* */
export class IsUserExistPipe implements PipeTransform<string, Promise<string>> {
    constructor(private readonly usersRepository: UsersRepository) {}

    async transform(value: string, metadata: ArgumentMetadata): Promise<string> {
        let user = null
        try {
            user = await this.usersRepository.findUserById(value)
        } catch {
            throw new NotFoundException('User not found');
        }
        return value
    }


}