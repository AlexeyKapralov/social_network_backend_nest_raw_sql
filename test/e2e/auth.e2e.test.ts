import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { agent as request } from 'supertest';
import { AppModule } from '../../src/app.module';
import { applyAppSettings } from '../../src/settings/apply-app-settings';
import { aDescribe } from '../utils/aDescribe';
import { skipSettings } from '../utils/skip-settings';
import { Connection, Types } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { UserManagerTest } from '../utils/userManager.test';
import { UsersRepository } from '../../src/features/users/infrastructure/users.repository';
import { NestExpressApplication } from '@nestjs/platform-express';
import { EmailService } from '../../src/base/services/email.service';
import { EmailServiceMock } from '../mock/email-service.mock';

aDescribe(skipSettings.for('authTests'))('AuthController (e2e)', () => {
    let app: NestExpressApplication;
    let userManagerTest: UserManagerTest;
    let userRepository: UsersRepository;
    let databaseConnection;

    beforeAll(async () => {
        // можно создать глобальный state
        // expect.setState([
        //     // adminTokens: loginResult
        // ]);

        //получение глобальных переменных
        // expect.getState();

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            // .overrideProvider(UsersService) // для мока (передаем класс который хотим переопределить)
            // .useClass(UserSeviceMock) // моковый класс
            // useFactory используется если нужно передававть какие-то данные внутрь, если данные передававть не надо, то используется UseClass
            // .useFactory({
            //         factory: (usersRepo: UsersRepository) => {
            //             return new UserServiceMock(usersRepo, {
            //                 count: 50
            //             } )
            //         },
            //          inject: [UsersQueryRepository, UsersRepository] //последовательность важна
            //     })
            .overrideProvider(EmailService)
            .useClass(EmailServiceMock)
            .compile();

        userRepository = moduleFixture.get<UsersRepository>(UsersRepository);

        app = moduleFixture.createNestApplication();

        // await NestFactory.create<NestExpressApplication>(AppModule);

        applyAppSettings(app);

        await app.init();

        databaseConnection = app.get<Connection>(getConnectionToken());
        await databaseConnection.dropDatabase();

        // const configService = app.get(ConfigService)
        // const apiSettings = configService.get<ApiSettings>('apiSettings')
        // console.log(apiSettings.ACCESS_TOKEN_EXPIRATION_LIVE)
        // console.log(apiSettings.REFRESH_TOKEN_EXPIRATION_LIVE)

        //подключение менеджера
        userManagerTest = new UserManagerTest(app);
    });

    afterAll(async () => {
        await app.close();
    });

    //todo регистрация +
    //todo ресенд письма
    //todo подтвердить код
    //todo отправить письмо восстановления
    //todo подтвердить восстановление
    //todo логин
    //todo рефреш токен
    //todo логаут
    //todo получить самого себя

    it('should create user and send email with confirmation code', async () => {
        const regBody = {
            login: 'FoNPDN0DQg',
            password: 'string',
            email: 'alexet@kapralov.site',
        };

        await request(app.getHttpServer())
            .post('/auth/registration')
            .send(regBody)
            .expect(HttpStatus.NO_CONTENT);

        const user = await userRepository.findUserByEmail(regBody.email);
        expect(user).toEqual({
            '__v': expect.any(Number),
            _id: expect.any(Types.ObjectId),
            'confirmationCode': expect.any(String),
            'createdAt': expect.any(String),
            'email': regBody.email,
            'isConfirmed': false,
            'isDeleted': false,
            'login': regBody.login,
            'password': expect.any(String),

        });
    });

});
