import {
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    HttpStatus,
    NotFoundException,
    Param,
    Post,
    Put,
    Query,
    Res,
    UseGuards,
} from '@nestjs/common';
import { BlogInputDto } from './dto/input/blog-input.dto';
import { BlogService } from '../application/blog.service';
import { QueryDtoBase, QueryDtoWithName } from '../../../../common/dto/query.dto';
import { BlogsQueryRepository } from '../infrastructure/blogsQuery.repository';
import { BlogDocument, BlogDocumentSql } from '../domain/blogs.entity';
import { Response } from 'express';
import { BlogPostInputDto } from './dto/input/blog-post-input.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtLocalService } from '../../../../base/services/jwt-local.service';
import { PostsQueryRepository } from '../../posts/infrastructure/posts-query.repository';
import { PostsViewDto } from '../../posts/api/dto/output/extended-likes-info-view.dto';

@Controller('blogs')
export class BlogsController {
    constructor(
        private readonly blogService: BlogService,
        private readonly blogQueryRepository: BlogsQueryRepository,
        private readonly postQueryRepository: PostsQueryRepository,
        private readonly jwtLocalService: JwtLocalService
    ) {
    }

    @Get()
    async getBlogs(
        @Query() query: QueryDtoWithName,
    ) {
        return await this.blogQueryRepository.findBlogs(query);
    }

    @Get(':blogId/posts')
    async getPostsForBlog(
        @Param('blogId') blogId: string,
        @Query() query: QueryDtoBase,
        @Res({ passthrough: true }) res: Response,
        @Headers('authorization') authorization: string
    ) {

        const userId = await this.jwtLocalService.parseJwtToken(authorization)

        let foundBlog
        try{
            foundBlog = await this.blogQueryRepository.findBlog(blogId)
        } catch {}

        if (!foundBlog){
            throw new NotFoundException()
        }

        const posts = await this.postQueryRepository.findPostsForBlog(query, blogId, userId)

        posts ? res.status(HttpStatus.OK).send(posts) : res.status(HttpStatus.NOT_FOUND)
    }

    @Get(':blogId')
    async getBlog(
        @Param('blogId') blogId: string,
        @Res({ passthrough: true }) res: Response,
    ) {
        const foundedBlog = await this.blogQueryRepository.findBlog(blogId);

        foundedBlog ? res.status(HttpStatus.OK).send(foundedBlog) : res.status(HttpStatus.NOT_FOUND);
    }
}