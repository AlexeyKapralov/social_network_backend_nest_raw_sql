import { Injectable } from '@nestjs/common';
import { UserViewDto } from '../api/dto/output/user-view.dto';
import { MeViewDto } from '../api/dto/output/me-view.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class UsersQueryRepository {
    constructor(
        @InjectDataSource() private dataSource: DataSource
    ) {}

    async findUserById(userId: string): Promise<UserViewDto> {

        try {
            const user = await this.dataSource.query(`
            SELECT 
                "id",
                "email",
                "login",
                "createdAt"
            FROM public.users 
            WHERE 
                "id" = $1 AND
                "isDeleted" = False
        `, [userId],
            );
            return user[0]
        } catch {
            return null
        }
    }

    async findMe(userId: string): Promise<MeViewDto> {

        try {
            const user = await this.dataSource.query(`
                SELECT 
                    email,
                    login,
                    id AS "userId"
                FROM public.users 
                WHERE 
                    "id" = $1 AND
                    "isDeleted" = False
            `, [userId],
            );
            return user[0]
        } catch {
            return null
        }
    }
}