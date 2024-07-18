import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { IsUniqueLogin } from '../../../../../common/decorators/validate/uniqueLogin.decorator';
import { IsUniqueEmail } from '../../../../../common/decorators/validate/uniqueEmail.decorator';
import { Trim } from '../../../../../common/decorators/transform/trim.decorator';

export class UserInputDto {
    //асинхронные должны быть сверху, так как работать будет снизу вверх, а лучше их вообще убрать
    @IsUniqueLogin()
    @Trim()
    @Length(3, 10)
    @IsString()
    @Matches('^[a-zA-Z0-9_-]*$')
    login: string

    @Trim()
    @Length(6, 20)
    @IsString()
    password: string

    //асинхронные должны быть сверху, так как работать будет снизу вверх, а лучше их ввобще убрать
    @IsUniqueEmail()
    @Trim()
    @IsEmail()
    @IsString()
    @Matches('^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$')
    email: string
}