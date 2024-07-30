import { HttpStatus, INestApplication } from '@nestjs/common';
import { agent as request } from 'supertest';
import { LikeInputDto } from '../../src/features/blogs/likes/api/dto/input/like-input.dto';

export class LikeManagerTest {
    constructor(
        protected readonly app: INestApplication,
    ) {}

    async likeOrDislikePost(accessToken: string, likeBody: LikeInputDto, postId: string) {
        const post = await request(this.app.getHttpServer())
            .put(`/posts/${postId}/like-status`)
            .set({authorization: `Bearer ${accessToken}`})
            .send(likeBody)
            .expect(HttpStatus.NO_CONTENT)

    }
}