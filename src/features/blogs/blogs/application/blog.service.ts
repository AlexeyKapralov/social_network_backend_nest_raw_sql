import { Injectable } from '@nestjs/common';
import { BlogInputDto } from '../api/dto/input/blog-input.dto';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { Blog } from '../domain/blogs.entity';
import { BlogPostInputDto } from '../api/dto/input/blog-post-input.dto';
import { PostsRepository } from '../../posts/infrastructure/posts.repository';
import { PostsQueryRepository } from '../../posts/infrastructure/posts-query.repository';
import { PostsViewDto } from '../../posts/api/dto/output/extended-likes-info-view.dto';

@Injectable()
export class BlogService {
    constructor(
        private readonly blogRepository: BlogsRepository,
        private readonly postsRepository: PostsRepository,
        private readonly postsQueryRepository: PostsQueryRepository,
    ) {}

    async createBlog(blogBody: BlogInputDto) {
        //todo правильно ли здесь создавать все поля для новой записи
        const blog: Blog = {
            name: blogBody.name,
            description: blogBody.description,
            createdAt: new Date().toISOString(),
            isMembership: false,
            isDeleted: false,
            websiteUrl: blogBody.websiteUrl
        }
        return await this.blogRepository.createBlog(blog)
    }

    async createPostForBlog(blogId: string, blogPostBody: BlogPostInputDto): Promise<PostsViewDto> | null {


        const foundBlog = await this.blogRepository.findBlog(blogId)
        if (!foundBlog) {
            return null
        }

        const createdPost = await this.postsRepository.createPost(
            blogPostBody.title,
            blogPostBody.shortDescription,
            blogPostBody.content,
            blogId,
            foundBlog.name,
        )

        return await this.postsQueryRepository.findPost(createdPost._id.toString())
    }

    async updateBlog(blogId: string, updateData: BlogInputDto) {
        const isUpdatedBlog = await this.blogRepository.updateBlog(blogId, updateData)
        return isUpdatedBlog.modifiedCount > 0
    }
    async deleteBlog(blogId: string) {
        const isDeleteBlog = await this.blogRepository.deleteBlog(blogId)
        return isDeleteBlog.modifiedCount
    }


}