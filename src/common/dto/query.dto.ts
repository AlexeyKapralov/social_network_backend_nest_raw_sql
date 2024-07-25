import { Transform, TransformFnParams, Type } from 'class-transformer';
import { IsDefined, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum SortDirection {
    ASC = 'asc',
    DESC = 'desc'
}

export class QueryDtoBase {
    @IsString()
    sortBy: string = 'createdAt'
    @IsDefined({message: 'sortDirection must be one of the following values: asc, desc'})
    @Transform(({ value }: TransformFnParams) => {
        switch (value) {
            case SortDirection.ASC:
                return 1;
            case SortDirection.DESC:
                return -1;
        }
    })
    sortDirection: number = -1
    @Type( () => Number)
    @IsNumber()
    @Min(1)
    pageNumber: number = 1
    @Type( () => Number)
    @IsNumber()
    @Min(1)
    pageSize: number = 10
}

export class QueryDtoWithEmailAndLogin extends QueryDtoBase{
    searchLoginTerm: string = null
    searchEmailTerm: string = null
}

export class QueryDtoWithName extends QueryDtoBase{
    searchNameTerm: string = null
}



