import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Post,
    Query,
    Res,
    UseGuards,
} from '@nestjs/common';
import { UsersService } from '../application/users.service';
import { UserInputDto } from './dto/input/user-input.dto';
import { Response } from 'express';
import { UsersQueryRepository } from '../infrastructure/users-query.repository';
import { IsUserExistPipe } from '../../../common/pipes/is-user-exist.pipe';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserCommand, CreateUserResultData } from '../application/usecases/create-user.usecase';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { InterlayerNotice } from '../../../base/models/interlayer';
import { QueryDtoWithEmailAndLogin } from '../../../common/dto/query.dto';
import { FindUsersQueryPayload } from '../infrastructure/queries/find-users.query';
import { Paginator } from '../../../common/dto/paginator.dto';
import { UserViewDto } from './dto/output/user-view.dto';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly usersQueryRepository: UsersQueryRepository,
        //шина для command
        private readonly commandBus: CommandBus,
        //шина для query
        private readonly queryBus: QueryBus
    ) {}

    @UseGuards(AuthGuard('basic')) //можно так, а можно создать отдельный guard, который implement этот AuthGuard: @UseGuards(BasicAuthGuard)
    @Get()
    async getUsers(
        @Query() query: QueryDtoWithEmailAndLogin
    ) {
        const payload = new FindUsersQueryPayload(
            query.sortBy,
            query.sortDirection,
            query.pageNumber,
            query.pageSize,
            query.searchLoginTerm,
            query.searchEmailTerm
        )

        const findResult = await this.queryBus.execute<
            FindUsersQueryPayload,
            InterlayerNotice<Paginator<UserViewDto>>
        >(payload)

        return findResult.data
    }

    @UseGuards(AuthGuard('basic'))
    @Post()
    async createUser(
        @Body() userBody: UserInputDto,
    ) {
        const command = new CreateUserCommand(userBody.login, userBody.password, userBody.email)

        const createdUser = await this.commandBus.execute<
            CreateUserCommand, InterlayerNotice<CreateUserResultData>
        >(command)

        if (createdUser.hasError()) {
            throw new BadRequestException(createdUser.extensions)
        }

        return await this.usersQueryRepository.findUserById(createdUser.data.userId)

    }

    @UseGuards(AuthGuard('basic'))
    @Delete(':userId')
    async deleteUser(
        @Param('userId', IsUserExistPipe) userId: string,
        @Res({passthrough: true}) res: Response,
    ) {
        const isDeleteUser = await this.usersService.deleteUser(userId)
        isDeleteUser ? res.status(HttpStatus.NO_CONTENT) : res.status(HttpStatus.NOT_FOUND)
    }
}
