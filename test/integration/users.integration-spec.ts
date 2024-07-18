import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { UsersRepository } from '../../src/features/users/infrastructure/users.repository';
import { applyAppSettings } from '../../src/settings/apply-app-settings';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { UserManagerTest } from '../utils/userManager.test';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from '../../src/settings/env/configuration';
import {
  CreateUserCommand,
  CreateUserResultData,
} from '../../src/features/users/application/usecases/create-user.usecase';
import { InterlayerNotice } from '../../src/base/models/interlayer';
import { CommandBus } from '@nestjs/cqrs';
import { UserViewDto } from '../../src/features/users/api/dto/output/user-view.dto';
import { NestExpressApplication } from '@nestjs/platform-express';

describe('integration test', () => {
  let app: NestExpressApplication;
  let userManagerTest: UserManagerTest;
  let userRepository: UsersRepository;

  beforeAll(async () => {
    // можно создать глобальный state
    // expect.setState([
    //     // adminTokens: loginResult
    // ]);

    //получение глобальных переменных
    expect.getState();

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
        .compile();

    userRepository = moduleFixture.get<UsersRepository>(UsersRepository);

    app = moduleFixture.createNestApplication();

    applyAppSettings(app);

    await app.init();

    const databaseConnection = app.get<Connection>(getConnectionToken());
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

  it('should create user in db', async () => {
    const userBody = {
      login: 'login1234',
      password: 'login1234',
      email: 'login1234',
    }

    const commandBus = app.get<CommandBus>(CommandBus)

    const command = new CreateUserCommand(userBody.login, userBody.password, userBody.email)

    const createdUser = await commandBus.execute<
        CreateUserCommand, InterlayerNotice<CreateUserResultData>
    >(command)

    expect(createdUser.data).toEqual({
      userId:expect.any(String)
    })

    let userDB: UserViewDto = await userManagerTest.getUserById(createdUser.data.userId)

    userDB = JSON.parse(JSON.stringify(userDB))

    expect(userDB).toEqual({
      login: 'login1234',
      email: 'login1234',
      id: expect.any(String),
      createdAt: expect.stringMatching(
          /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/)
    })

  });

});
