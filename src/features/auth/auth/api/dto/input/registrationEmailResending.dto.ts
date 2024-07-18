import { IsEmail, IsString, Matches } from 'class-validator';
import { Trim } from '../../../../../../common/decorators/transform/trim.decorator';
import {
    IsExistEmailAndNotConfirmedCode
} from '../../../../../../common/decorators/validate/isExistEmailAndNotConfirmedCode.decorator';

export class RegistrationEmailResendingDto {
    //асинхронные должны быть сверху, так как работать будет снизу вверх
    @Trim()
    @IsExistEmailAndNotConfirmedCode()
    @IsString()
    @IsEmail()
    @Matches('^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$')
    email: string;
}