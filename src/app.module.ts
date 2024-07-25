import { Global, Module, Provider } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IsUniqueLoginConstraint } from './common/decorators/validate/uniqueLogin.decorator';
import { IsUniqueEmailConstraint } from './common/decorators/validate/uniqueEmail.decorator';
import { IsExistConfirmationCodeConstraint } from './common/decorators/validate/isExistConfirmedCode.decorator';
import {
    IsExistEmailAndNotConfirmedCodeConstraint,
} from './common/decorators/validate/isExistEmailAndNotConfirmedCode.decorator';
import { IsExistEmailConstraint } from './common/decorators/validate/isExistEmail.decorator';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration, { ConfigurationType, validate } from './settings/env/configuration';
import { UsersModule } from './features/users/users.module';
import { TestingModule } from './features/testing/testing.module';
import { BlogsModule } from './features/blogs/blogs.module';
import { AuthModule } from './features/auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import process from 'node:process';

const decorators: Provider[] = [
    IsUniqueLoginConstraint,
    IsUniqueEmailConstraint,
    IsExistConfirmationCodeConstraint,
    IsExistEmailAndNotConfirmedCodeConstraint,
    IsExistEmailConstraint,
    // IsExistBlogConstraint
];

@Global()
@Module({
    imports: [
        ThrottlerModule.forRoot([{
            ttl: 10000,
            limit: 5,
        }]),

        // MongooseModule.forRootAsync({
        //         useFactory: (configService: ConfigService<ConfigurationType>) => {
        //             const environmentSettings = configService.get('environmentSettings', {
        //                 infer: true,
        //             });
        //             const databaseSettings = configService.get('databaseSettings', {
        //                 infer: true,
        //             });
        //             const uri = environmentSettings.isTesting
        //                 ? databaseSettings.MONGO_CONNECTION_URI_FOR_TESTS
        //                 : databaseSettings.MONGO_CONNECTION_URI;
        //             console.log(uri);
        //
        //             return {
        //                 uri: uri,
        //             };
        //         },
        //         inject: [ConfigService],
        //     }
        // ),

        TypeOrmModule.forRoot({
            type: 'postgres',
            host: 'localhost', //'127.0.0.1',
            username: 'postgres',
            password: process.env.DB_PASSWORD,
            database: 'social_network',
            port: 5432,
            // ssl: true,
            // url: process.env.POSTGRESQL_CONNECTION_URI,
            autoLoadEntities: false, //false для raw_sql только
            synchronize: false, //false для raw_sql только

        }),

        UsersModule,
        BlogsModule,
        AuthModule,
        PassportModule,
        TestingModule.register(process.env.ENV),
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
            validate: validate,
            ignoreEnvFile: false, //для development
            // ignoreEnvFile: process.env.ENV !== Environments.DEVELOPMENT && process.env.ENV !== Environments.TEST, //для production и staging
            envFilePath: ['.env.local', /*'.env'*/],
        }),
    ],
    providers: [
        ...decorators,
        //используется для того, чтобы применить глобально throttler
        // {
        //     provide: APP_GUARD,
        //     useClass: ThrottlerGuard,
        // }
    ],
})
export class AppModule {}
