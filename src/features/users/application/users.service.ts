import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';

@Injectable()
export class UsersService {
    constructor(
        private usersRepository: UsersRepository,
    ) {}

    async deleteUser(userId: string) {
        return await this.usersRepository.deleteUser(userId);
    }

}
