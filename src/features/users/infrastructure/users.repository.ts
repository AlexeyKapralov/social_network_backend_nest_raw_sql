import { Injectable } from '@nestjs/common';
import { UserInputDto } from '../api/dto/input/user-input.dto';
import { UserDocument, UserDocumentSql } from '../domain/user.entity';
import { RegistrationConfirmationCodeDto } from '../../auth/auth/api/dto/input/registrationConfirmationCode.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class UsersRepository {
    constructor(
        @InjectDataSource() private dataSource: DataSource,
    ) {
    }

    async createUser(userBody: UserInputDto, passHash: string, confirmationCode: string): Promise<string> {
        try {
            const user = await this.dataSource.query(`
            INSERT INTO public.users(
                "email",
                "password",
                "login",
                "isDeleted",
                "isConfirmed",
                "confirmationCode"
            )
            VALUES (
                $1,
                $2,
                $3,
                False,
                False,
                $4
            )
            RETURNING "id"
        `,
                [userBody.email, passHash, userBody.login, confirmationCode],
            );
            return user[0].id;
        } catch (e) {
            console.log('users repo/create user error: ', e);
            return null;
        }
    }

    async deleteUser(userId: string): Promise<boolean> {
        try {
            const isDeleted = await this.dataSource.query(`
                UPDATE public.users
                SET "isDeleted" = True
                WHERE "id" = $1 AND "isDeleted" = False;
            `, [userId],
            );
            return isDeleted[1] === 1
        } catch {
            return false
        }
    }

    async findUserById(userId: string): Promise<UserDocumentSql> {
        try {
            const user = await this.dataSource.query(`
                SELECT 
                    id,
                    password,
                    email,  
                    login, 
                    "createdAt",
                    "confirmationCode"
                FROM public.users 
                WHERE 
                    "id" = $1 AND "isDeleted" = False
            `, [userId],
            );
            return user[0]
        } catch {
            return null
        }

    }

    async findUserByLogin(login: string): Promise<UserDocumentSql> {
        try {
            const user = await this.dataSource.query(`
            SELECT 
                "id",
                "password",
                "email",
                "login",
                "createdAt",
                "confirmationCode"
            FROM public.users 
            WHERE
                "login" = $1 AND "isDeleted" = False
        `, [login]);
            return user[0];
        } catch {
            return null;
        }
    }

    async findUserByEmail(email: string): Promise<UserDocumentSql> {
        try {
            const user = await this.dataSource.query(`
                SELECT 
                    "id",
                    "password",
                    "email",
                    "login",
                    "createdAt",
                    "confirmationCode"
                FROM public.users 
                WHERE
                    "email" = $1 AND "isDeleted" = False
            `, [email]);
            return user[0];
        } catch {
            return null;
        }
    }

    async findUserByEmailAndNotConfirmed(email: string): Promise<UserDocumentSql> {
        try {
            const user = await this.dataSource.query(`
                SELECT 
                    "id",
                    "password",
                    "email",
                    "login",
                    "createdAt",
                    "confirmationCode"
                FROM public.users 
                WHERE 
                    "email" = $1 AND
                    "isDeleted" = False AND
                    "isConfirmed" = False
            `, [email],
            );
            return user[0]
        } catch {
            return null
        }
    }

    async findUserByConfirmationCode(confirmationCode: string): Promise<UserDocument> {
        try {
            const user = await this.dataSource.query(`
                SELECT 
                    "id",
                    "password",
                    "email",
                    "login",
                    "createdAt",
                    "confirmationCode"
                FROM public.users 
                WHERE 
                    "confirmationCode" = $1 AND
                    "isDeleted" = False AND
                    "isConfirmed" = False
            `, [confirmationCode],
            );
            return user[0]
        } catch {
            return null
        }
    }

    async confirmUserRegistration(confirmationCode: RegistrationConfirmationCodeDto): Promise<boolean> {
        try {
            const isConfirmed = await this.dataSource.query(`
                UPDATE public.users
                SET "isConfirmed" = True
                WHERE "confirmationCode" = $1 AND "isDeleted" = False;
            `, [confirmationCode.code],
            );
            return isConfirmed[1] === 1
        } catch {
            return false
        }
    }

    async updateConfirmationCode(email: string, newConfirmationCode: string): Promise<boolean> {
        try {
            const isConfirmed = await this.dataSource.query(`
                UPDATE public.users
                SET "confirmationCode" = $2, "isConfirmed" = False 
                WHERE "email" = $1 AND "isDeleted" = False;
            `, [email, newConfirmationCode],
            );
            return isConfirmed[1] === 1
        } catch {
            return false
        }
    }

    async updatePassword(confirmationCode: string, passwordHash: string): Promise<boolean> {
        try {
            const isConfirmed = await this.dataSource.query(`
                UPDATE public.users
                SET "password" = $2 
                WHERE "confirmationCode" = $1 AND "isDeleted" = False AND "isConfirmed" = False;
            `, [confirmationCode, passwordHash],
            );
            return isConfirmed[1] === 1
        } catch {
            return false
        }
    }
}