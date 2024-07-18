import { Injectable } from '@nestjs/common';
import { Blog, BlogModelType } from '../domain/blogs.entity';
import { InjectModel } from '@nestjs/mongoose';
import { BlogInputDto } from '../api/dto/input/blog-input.dto';
import { PostsQueryRepository } from '../../posts/infrastructure/posts-query.repository';

@Injectable()
export class BlogsRepository {
    constructor(
        @InjectModel(Blog.name) private readonly blogModel: BlogModelType,
        private readonly postQueryRepository: PostsQueryRepository
    ) {
    }

    async createBlog(blog: Blog) {
        return await this.blogModel.create(blog);
    }

    async updateBlog(blogId: string, updateData: BlogInputDto) {
        return this.blogModel.updateOne(
            { _id: blogId, isDeleted: false },
            {
                ...updateData
            },
        )
    }

    async deleteBlog(blogId: string) {
        return this.blogModel.updateOne(
            {_id: blogId , isDeleted: false},
            { isDeleted: true }
        )
    }

    async findBlog(blogId: string) {
        return this.blogModel.findOne({
            _id: blogId, isDeleted: false
        })
    }


}