import { UsersRepository } from '../../src/features/users/infrastructure/users.repository';
import { UsersService } from '../../src/features/users/application/users.service';
import { Promise } from 'mongoose';

export class UserServiceMock extends UsersService {
    constructor(
        usersRepository: UsersRepository,
    ) {
        super(usersRepository)
    }
    deleteUser(userId: string) {
        return Promise.resolve(true)
    }
}