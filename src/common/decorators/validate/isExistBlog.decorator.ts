import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { ValidationArguments } from 'class-validator/types/validation/ValidationArguments';
import { BlogsRepository } from '../../../features/blogs/blogs/infrastructure/blogs.repository';

@ValidatorConstraint({ name: 'IsExistBlog', async: true })
@Injectable()
export class IsExistBlogConstraint implements ValidatorConstraintInterface {
    constructor(
        private readonly blogsRepository: BlogsRepository
    ) {}

    async validate(value: any, args: ValidationArguments): Promise<boolean> {
        const user = await this.blogsRepository.findBlog(value);
        return !!user;
    }

    defaultMessage?(validationArguments?: ValidationArguments): string {
        return `Blog does not exist`;
    }
}

export function IsExistBlog(
    property?: string,
    validationOptions?: ValidationOptions,
) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [property],
            validator: IsExistBlogConstraint,
        });
    };
}
