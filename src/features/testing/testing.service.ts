import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class TestingService {
    constructor(
        @InjectDataSource() private datasource: DataSource,
    ) {
    }

    getHello(): string {
        return 'Hello World!';
    }

    async deleteAll() {

        await this.datasource.query(`
            TRUNCATE 
                public.users,
                public.posts, 
                public.blogs,
                public.comments,
                public.devices, 
                public.likes`
        );
    }
}
