import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { UsersRepository } from '../../features/users/infrastructure/users.repository';
import { CryptoService } from '../../base/services/crypto.service';
import { NewPasswordRecoveryInputDto } from '../../features/auth/auth/api/dto/input/newPasswordRecoveryInput.dto';

@Injectable()
export class NewPasswordPipe implements PipeTransform {
    constructor(
        private readonly userRepository: UsersRepository,
        private cryptoService: CryptoService
    ) {}

    async transform(value: NewPasswordRecoveryInputDto, metadata: ArgumentMetadata) {
        const user = await this.userRepository.findUserByConfirmationCode(value.recoveryCode)

        if (!user) throw new BadRequestException('code is not valid');

        const isOldPassword = await this.cryptoService.comparePasswordsHash(value.newPassword, user.password)

        if (isOldPassword) {
            throw new BadRequestException('password is not new');
        }

        return value;
    }
}