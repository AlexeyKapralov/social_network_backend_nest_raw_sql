import { HttpStatus, INestApplication } from '@nestjs/common';
import { agent as request } from 'supertest';
import { PostInputDto } from '../../src/features/blogs/posts/api/dto/input/post-input.dto';
import { PostsViewDto } from '../../src/features/blogs/posts/api/dto/output/extended-likes-info-view.dto';

export class PostManagerTest {
    constructor(
        protected readonly app: INestApplication,
    ) {}

    async createPost(postBody: PostInputDto, accessToken: string): Promise<PostsViewDto> {
        //todo использовать значения из env Из config
        //todo переписать в менеджер отдельную функцию
        const buff = Buffer.from('admin:qwerty', 'utf-8')
        const decodedAuth = buff.toString('base64')

        const post =  await request(this.app.getHttpServer())
            .post(`/posts`)
            .set({authorization: `Bearer ${accessToken}`})
            .send(postBody)
            .expect(HttpStatus.CREATED)
        return post.body
    }

}