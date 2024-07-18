import { HttpStatus, INestApplication } from '@nestjs/common';
import { agent as request } from 'supertest';
import { UserInputDto } from '../../src/features/users/api/dto/input/user-input.dto';
import { UserViewDto } from '../../src/features/users/api/dto/output/user-view.dto';
import { UsersQueryRepository } from '../../src/features/users/infrastructure/users-query.repository';

export class UserManagerTest {
    constructor(
        protected readonly app: INestApplication,
    ) {}

    async createUser(userBody: UserInputDto): Promise<UserViewDto> {
        //todo использовать значения из env Из config
        //todo переписать в менеджер отдельную функцию
        const buff = Buffer.from('admin:qwerty', 'utf-8')
        const decodedAuth = buff.toString('base64')

        const user =  await request(this.app.getHttpServer())
            .post('/users')
            .set({authorization: `Basic ${decodedAuth}`})
            .send(userBody)
            .expect(HttpStatus.CREATED)
        return user.body
    }

    async getUserById(userId: string): Promise<UserViewDto> {
        const usersQueryRepository = this.app.get<UsersQueryRepository>(UsersQueryRepository)

        return await usersQueryRepository.findUserById(userId)
    }

}