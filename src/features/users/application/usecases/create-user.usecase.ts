import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { IsUniqueEmail } from '../../../../common/decorators/validate/uniqueEmail.decorator';
import { CommandHandler, EventBus, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { InterlayerNotice } from '../../../../base/models/interlayer';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UserInputDto } from '../../api/dto/input/user-input.dto';
import { CryptoService } from '../../../../base/services/crypto.service';
import { v4 as uuid } from 'uuid';
import { UserCreatedEvent } from '../events/user-created.event';

export class CreateUserCommand implements ICommand{
    constructor(
        public login: string,
        public password: string,
        public email: string,
    ) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand, InterlayerNotice<CreateUserResultData>>{

    constructor(
        private readonly userRepository: UsersRepository,
        private readonly cryptoService: CryptoService,
        private readonly eventBus: EventBus,
    ) {}

    async execute(command: CreateUserCommand): Promise<InterlayerNotice<CreateUserResultData>> {
        const {login, password, email} = command

        const confirmationCode = uuid();
        const passHash = await this.cryptoService.createPasswordHash( password );
        const userBody: UserInputDto = {
            password,
            login,
            email
        }
        const notice = new InterlayerNotice<CreateUserResultData>

        const userId = await this.userRepository.createUser(userBody, passHash, confirmationCode)

        // Вариант валидации на уровне BLL
        // if (email === 'admin@site.com') {
        //     notice.addError('Email not valid', 'email');
        //     return notice;
        // }

        // В шину событий публикуем событие UserCreatedEvent
        this.eventBus.publish(new UserCreatedEvent(email));

        notice.addData({ userId: userId });

        return notice;

    }

}


export type CreateUserResultData = {
    userId: string;
};