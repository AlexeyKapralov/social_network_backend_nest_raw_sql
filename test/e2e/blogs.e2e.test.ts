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

aDescribe(skipSettings.for('authTests'))('AppController (e2e)', () => {
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

    //todo создать несколько блогов+
    //todo получить блоги+
    //todo обновить блог+
    //todo удалить блог+
    //todo создать пост для блога+
    //todo получить пост для блога+
    //todo обновить пост для блога+
    //todo удалить пост для блога+

});
