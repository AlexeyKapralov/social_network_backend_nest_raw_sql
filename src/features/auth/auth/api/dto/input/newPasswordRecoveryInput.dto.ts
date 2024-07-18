import { IsString, IsUUID, Length } from 'class-validator';
import { Trim } from '../../../../../../common/decorators/transform/trim.decorator';

export class NewPasswordRecoveryInputDto {
    @Trim()
    @Length(6,20)
    @IsString()
    newPassword: string

    @Trim()
    @IsString()
    @IsUUID()
    recoveryCode:	string
}