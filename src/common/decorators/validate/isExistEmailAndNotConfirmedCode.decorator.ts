import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { ValidationArguments } from 'class-validator/types/validation/ValidationArguments';
import { UsersRepository } from '../../../features/users/infrastructure/users.repository';

@ValidatorConstraint({ name: 'IsExistEmailAndNotConfirmedCode', async: true })
@Injectable()
export class IsExistEmailAndNotConfirmedCodeConstraint implements ValidatorConstraintInterface {
    constructor(private readonly usersRepository: UsersRepository) {}

    async validate(value: any, args: ValidationArguments): Promise<boolean> {
        const user = await this.usersRepository.findUserByEmailAndNotConfirmed(args.value);
        return !!user;
    }

    defaultMessage?(validationArguments?: ValidationArguments): string {
        return `User does not exist or already confirmed`;
    }
}

export function IsExistEmailAndNotConfirmedCode(
    property?: string,
    validationOptions?: ValidationOptions,
) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [property],
            validator: IsExistEmailAndNotConfirmedCodeConstraint,
        });
    };
}
