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


    // it('/ (GET)', () => {
    //     return request(app.getHttpServer())
    //         .get('/')
    //         .expect(200)
    //         .expect('Hello World!');
    // });
    //
    // it('get empty array', async () => {
    //     //todo использовать значения из env Из config
    //     //todo переписать в менеджер отдельную функцию
    //     const buff = Buffer.from('admin:qwerty', 'utf-8');
    //     const decodedAuth = buff.toString('base64');
    //
    //     return await request(app.getHttpServer())
    //         .get('/users')
    //         .set({ authorization: `Basic ${decodedAuth}` })
    //         .expect(HttpStatus.OK)
    //         .expect({
    //             pagesCount: 0,
    //             page: 1,
    //             pageSize: 10,
    //             totalCount: 0,
    //             items: [],
    //         });
    // });
    //
    // it('should create user', async () => {
    //     const userBody = {
    //         login: 'qS-9oRnN-',
    //         password: 'string',
    //         email: 'example@example.com',
    //     };
    //
    //     expect.setState({
    //         userBody: userBody,
    //     });
    //
    //     const user = await userManagerTest.createUser(userBody);
    //
    //     expect(user).toEqual({
    //         id: expect.any(String),
    //         login: userBody.login,
    //         email: userBody.email,
    //         createdAt: expect.stringMatching(
    //             /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
    //         ),
    //     });
    // });
    //
    // it('should get user with pagination', async () => {
    //     const { userBody } = expect.getState();
    //
    //     //todo использовать значения из env Из config
    //     //todo переписать в менеджер отдельную функцию
    //     const buff = Buffer.from('admin:qwerty', 'utf-8');
    //     const decodedAuth = buff.toString('base64');
    //
    //     const user = await request(app.getHttpServer())
    //         .get('/users')
    //         .set({ authorization: `Basic ${decodedAuth}` })
    //         .expect(HttpStatus.OK);
    //
    //     expect.setState({ user: user.body });
    //
    //     expect(user.body).toEqual({
    //         pagesCount: 1,
    //         page: 1,
    //         pageSize: 10,
    //         totalCount: 1,
    //         items: [
    //             {
    //                 id: expect.any(String),
    //                 login: userBody.login,
    //                 email: userBody.email,
    //                 createdAt: expect.stringMatching(
    //                     /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
    //                 ),
    //             },
    //         ],
    //     });
    // });
    //
    // it('should delete user', async () => {
    //     const state = expect.getState();
    //
    //     const stateUser = state.user.items[0];
    //     const user = await userRepository.findUserByEmail(stateUser.email);
    //
    //     expect(user.toObject()).toEqual({
    //         __v: expect.any(Number),
    //         _id: new Types.ObjectId(stateUser.id),
    //         confirmationCode: expect.any(String),
    //         createdAt: stateUser.createdAt,
    //         email: stateUser.email,
    //         isConfirmed: false,
    //         isDeleted: false,
    //         login: stateUser.login,
    //         password:
    //             expect.any(String),
    //     });
    //
    //     //todo использовать значения из env Из config
    //     //todo переписать в менеджер отдельную функцию
    //     const buff = Buffer.from('admin:qwerty', 'utf-8');
    //     const decodedAuth = buff.toString('base64');
    //
    //     await request(app.getHttpServer())
    //         .delete(`/users/${user._id.toString()}`)
    //         .set({ authorization: `Basic ${decodedAuth}` })
    //         .expect(HttpStatus.NO_CONTENT);
    //
    //     const deletedUser = await userRepository.findUserByEmail(stateUser.email);
    //     expect(deletedUser).toBeNull()
    // });
});
