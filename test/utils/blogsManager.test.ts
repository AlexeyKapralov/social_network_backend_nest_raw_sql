import { HttpStatus, INestApplication } from '@nestjs/common';
import { agent as request } from 'supertest';
import { UserViewDto } from '../../src/features/users/api/dto/output/user-view.dto';
import { UsersQueryRepository } from '../../src/features/users/infrastructure/users-query.repository';
import { BlogInputDto } from '../../src/features/blogs/blogs/api/dto/input/blog-input.dto';
import { BlogViewDto } from '../../src/features/blogs/blogs/api/dto/output/blogViewDto';

export class BlogsManagerTest {
    constructor(
        protected readonly app: INestApplication,
    ) {}

    async createBlog(blogBody: BlogInputDto): Promise<BlogViewDto> {
        //todo использовать значения из env Из config
        //todo переписать в менеджер отдельную функцию
        const buff = Buffer.from('admin:qwerty', 'utf-8')
        const decodedAuth = buff.toString('base64')
        const blogResponse =  await request(this.app.getHttpServer())
            .post(`/sa/blogs`)
            .set({authorization: `Basic ${decodedAuth}`})
            .send(blogBody)
            .expect(HttpStatus.CREATED)
        return blogResponse.body
    }

    async createPosts(count: number, userId): Promise<UserViewDto[]> {
        //todo использовать значения из env Из config
        const buff = Buffer.from('admin:qwerty', 'utf-8')
        const decodedAuth = buff.toString('base64')

        const users = []
        for (let i = 0; i < count; i++) {
            const user =  await request(this.app.getHttpServer())
                .post('/users')
                .set({authorization: `Basic ${decodedAuth}`})
                .send({
                    login: `login${count}`,
                    password: `password${count}`,
                    email: `email${count}@mail.ru`
                })
                .expect(HttpStatus.CREATED)
            users.push(user)
        }
        return users

    }

    async getUserById(userId: string): Promise<UserViewDto> {
        const usersQueryRepository = this.app.get<UsersQueryRepository>(UsersQueryRepository)

        return await usersQueryRepository.findUserById(userId)
    }

}