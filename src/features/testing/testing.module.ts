import { DynamicModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/domain/user.entity';
import { TestingService } from './testing.service';
import { TestingController } from './testing.controller';
import { Blog, BlogSchema } from '../blogs/blogs/domain/blogs.entity';
import { Post, PostSchema } from '../blogs/posts/domain/posts.entity';
import {
    Comment,
    CommentSchema,
} from '../blogs/comments/domain/comment.entity';
import { Device, DeviceSchema } from '../auth/devices/domain/device.entity';
import { Like, LikeSchema } from '../blogs/likes/domain/likes.entity';
import { config } from 'dotenv';

config()

@Module({})
export class TestingModule {
    static register(env): DynamicModule {
        if (process.env.ENV !== 'PRODUCTION') {
            return {
                module: TestingModule,
                imports: [
                    MongooseModule.forFeature([
                        {
                            name: User.name,
                            schema: UserSchema,
                        },
                        {
                            name: Blog.name,
                            schema: BlogSchema,
                        },
                        {
                            name: Post.name,
                            schema: PostSchema,
                        },
                        {
                            name: Comment.name,
                            schema: CommentSchema,
                        },
                        {
                            name: Device.name,
                            schema: DeviceSchema
                        },
                        {
                            name: Like.name,
                            schema: LikeSchema
                        }
                    ])
                ],
                controllers: [TestingController],
                providers: [TestingService],
                exports: [TestingService]
            }
        }

        return {
            module: TestingModule,
            imports: [],
            controllers: [],
            providers: []
        }

    }
}