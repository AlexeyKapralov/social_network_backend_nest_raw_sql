import { HttpStatus, INestApplication } from '@nestjs/common';
import { agent as request } from 'supertest';
import { LoginInputDto } from '../../src/features/auth/auth/api/dto/input/loginInput.dto';

export class AuthManagerTest {
    constructor(
        protected readonly app: INestApplication,
    ) {}

    async login(authBody: LoginInputDto): Promise<{accessToken: string}> {
        //todo использовать значения из env Из config
        //todo переписать в менеджер отдельную функцию
        const loginResponse =  await request(this.app.getHttpServer())
            .post(`/auth/login`)
            .send(authBody)
            .expect(HttpStatus.OK)
        return loginResponse.body
    }


}