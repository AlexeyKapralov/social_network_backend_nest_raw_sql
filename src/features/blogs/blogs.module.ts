import { Module } from '@nestjs/common';
import { BlogsController } from './blogs/api/blogs.controller';
import { BlogService } from './blogs/application/blog.service';
import { BlogsRepository } from './blogs/infrastructure/blogs.repository';
import { BlogsQueryRepository } from './blogs/infrastructure/blogsQuery.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './posts/domain/posts.entity';
import { Blog, BlogSchema } from './blogs/domain/blogs.entity';
import { PostsController } from './posts/api/posts.controller';
import { PostsService } from './posts/application/posts.service';
import { PostsRepository } from './posts/infrastructure/posts.repository';
import { PostsQueryRepository } from './posts/infrastructure/posts-query.repository';
import { Comment, CommentSchema } from './comments/domain/comment.entity';
import { CommentsService } from './comments/application/comments.service';
import { CommentsRepository } from './comments/infrastructure/comments.repository';
import { CommentsQueryRepository } from './comments/infrastructure/commentsQuery.repository';
import { CreateCommentUseCase } from './comments/application/usecases/create-comment.usecase';
import { LikeCommentUseCase } from './comments/application/usecases/like-comment.usecase';
import { GetCommentsQuery } from './comments/infrastructure/queries/get-comments.query';
import { CqrsModule } from '@nestjs/cqrs';
import { Like, LikeSchema } from './likes/domain/likes.entity';
import { CommentsController } from './comments/api/comments.controller';
import { LikeService } from './likes/application/like.service';
import { LikeRepository } from './likes/repository/like.repository';
import { LikeQueryRepository } from './likes/repository/like-query.repository';
import { User, UserSchema } from '../users/domain/user.entity';
import { UsersModule } from '../users/users.module';
import { IsExistBlogConstraint } from '../../common/decorators/validate/isExistBlog.decorator';
import { JwtLocalService } from '../../base/services/jwt-local.service';
import { JwtService } from '@nestjs/jwt';
import { BlogsSuperAdminController } from './blogs/api/blogs-super-admin.controller';

@Module({
    imports: [
        CqrsModule,
        UsersModule,
        // MongooseModule.forFeature([
        //     {
        //         name: User.name,
        //         schema: UserSchema,
        //     },
        //     {
        //         name: Post.name,
        //         schema: PostSchema,
        //     },
        //     // {
        //     //     name: Blog.name,
        //     //     schema: BlogSchema,
        //     // },
        //     {
        //         name: Comment.name,
        //         schema: CommentSchema,
        //     },
        //     {
        //         name: Like.name,
        //         schema: LikeSchema
        //     }
        // ])
    ],
    controllers: [BlogsController, BlogsSuperAdminController, PostsController, CommentsController],
    providers: [
        BlogService,
        BlogsRepository,
        BlogsQueryRepository,
        //blogs decorators
        IsExistBlogConstraint,

        PostsService,
        PostsRepository,
        PostsQueryRepository,

        CommentsService,
        CommentsRepository,
        CommentsQueryRepository,
        CreateCommentUseCase,
        LikeCommentUseCase,
        GetCommentsQuery,

        LikeService,
        LikeRepository,
        LikeQueryRepository,

        //services
        JwtLocalService,
        JwtService
    ],
    exports: [
        BlogService, BlogsQueryRepository,

        PostsService, PostsQueryRepository,

        CommentsService, CommentsQueryRepository,

        LikeService, LikeQueryRepository
    ]
})
export class BlogsModule {}