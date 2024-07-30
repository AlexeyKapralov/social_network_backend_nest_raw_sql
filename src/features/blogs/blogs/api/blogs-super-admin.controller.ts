import {
    Body,
    Controller,
    Delete,
    Get,
    Headers, HttpCode,
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
import { IsUserExistPipe } from '../../../../common/pipes/is-user-exist.pipe';
import { IsBlogExistPipe } from '../../../../common/pipes/is-blog-exist.pipe';
import { IsPostExistPipe } from '../../../../common/pipes/is-post-exist.pipe';
import { PostsService } from '../../posts/application/posts.service';
import { PostInputDto } from '../../posts/api/dto/input/post-input.dto';

@Controller('sa/blogs')
export class BlogsSuperAdminController {
    constructor(
        private readonly blogService: BlogService,
        private readonly postsService: PostsService,
        private readonly blogQueryRepository: BlogsQueryRepository,
        private readonly postQueryRepository: PostsQueryRepository,
        private readonly jwtLocalService: JwtLocalService
    ) {
    }

    @UseGuards(AuthGuard('basic'))
    @Get()
    async getBlogs(
        @Query() query: QueryDtoWithName,
    ) {
        return await this.blogQueryRepository.findBlogs(query);
    }

    @UseGuards(AuthGuard('basic'))
    @Post()
    async createBlog(
        @Body() blogBody: BlogInputDto,
    ) {
        const createdBlog: BlogDocumentSql = await this.blogService.createBlog(blogBody);
        return await this.blogQueryRepository.findBlog(createdBlog.id);
    }

    @UseGuards(AuthGuard('basic'))
    @Put(':blogId')
    async updateBlog(
        @Param('blogId') blogId: string,
        @Body() updateData: BlogInputDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const isUpdated = await this.blogService.updateBlog(blogId, updateData)
        isUpdated ? res.status(HttpStatus.NO_CONTENT) : res.status(HttpStatus.NOT_FOUND)
    }

    @UseGuards(AuthGuard('basic'))
    @Delete(':blogId')
    async deleteBlog(
        @Param('blogId') blogId: string,
        @Res({ passthrough: true }) res: Response,
    ) {
        const isDeleted = await this.blogService.deleteBlog(blogId)
        isDeleted ? res.status(HttpStatus.NO_CONTENT) : res.status(HttpStatus.NOT_FOUND)
    }
    @UseGuards(AuthGuard('basic'))
    @Post(':blogId/posts')
    async createPostForBlog(
        @Param('blogId') blogId: string,
        @Body() blogPostBody: BlogPostInputDto,
        @Res({passthrough: true}) res: Response
    ) {
        const createdPostForBlog: PostsViewDto | null = await this.blogService.createPostForBlog(blogId, blogPostBody)
        createdPostForBlog ? res.status(HttpStatus.CREATED).send(createdPostForBlog) : res.status(HttpStatus.NOT_FOUND)
    }

    @UseGuards(AuthGuard('basic'))
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

    @UseGuards(AuthGuard('basic'))
    @Put(':blogId/posts/:postId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updatePostForBlog(
        @Param('blogId', IsBlogExistPipe) blogId: string,
        @Param('postId', IsPostExistPipe) postId: string,
        @Body() blogPostInputDto: BlogPostInputDto
    ) {
        const isUpdatedInterLayer = await this.blogService.updatePostForBlog(blogId, blogPostInputDto, postId)
        if (isUpdatedInterLayer.hasError()) {
            throw new NotFoundException()
        }
    }

    @UseGuards(AuthGuard('basic'))
    @Delete(':blogId/posts/:postId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deletePostForBlog(
        @Param('blogId', IsBlogExistPipe) blogId: string,
        @Param('postId', IsPostExistPipe) postId: string,
        @Res({ passthrough: true }) res: Response
    ) {
        const isDeletedInterLayer = await this.blogService.deletePostForBlog(blogId, postId)
        if (isDeletedInterLayer.hasError()) {
            throw new NotFoundException()
        }
    }
}