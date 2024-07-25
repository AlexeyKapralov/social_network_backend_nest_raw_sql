import { Module } from '@nestjs/common';
import { UsersService } from './application/users.service';
import { UsersRepository } from './infrastructure/users.repository';
import { UsersQueryRepository } from './infrastructure/users-query.repository';
import { CreateUserUseCase } from './application/usecases/create-user.usecase';
import { FindUsersQuery } from './infrastructure/queries/find-users.query';
import { UserCreatedEventHandler } from './application/events/handlers/user-created.event-handler';
import { UsersController } from './api/users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.entity';
import { CryptoService } from '../../base/services/crypto.service';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
    imports: [
        // MongooseModule.forFeature([
        //     {
        //         name: User.name,
        //         schema: UserSchema,
        //     },
        // ]),
        CqrsModule
    ],
    controllers: [UsersController],
    providers: [
        UsersService,
        UsersRepository,
        UsersQueryRepository,
        //cqrs
        CreateUserUseCase,
        FindUsersQuery,
        UserCreatedEventHandler,
        //services
        CryptoService
    ],
    exports: [UsersService, UsersRepository, UsersQueryRepository],
})
export class UsersModule {}
