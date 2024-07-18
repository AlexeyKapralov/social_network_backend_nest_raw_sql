import { Injectable } from '@nestjs/common';
import { PostInputDto } from '../api/dto/input/post-input.dto';
import { PostsRepository } from '../infrastructure/posts.repository';
import { PostsQueryRepository } from '../infrastructure/posts-query.repository';
import { PostsViewDto } from '../api/dto/output/extended-likes-info-view.dto';
import { LikeRepository } from '../../likes/repository/like.repository';
import { BlogsQueryRepository } from '../../blogs/infrastructure/blogsQuery.repository';
import { InterlayerNotice } from '../../../../base/models/interlayer';

@Injectable()
export class PostsService {
    constructor(
        private readonly postsRepository: PostsRepository,
        private readonly blogsQueryRepository: BlogsQueryRepository,
        private readonly postQueryRepository: PostsQueryRepository,
        private readonly likesRepository: LikeRepository
    ) {
    }

    async createPost(postInputData: PostInputDto): Promise<InterlayerNotice<PostsViewDto>> {
        const notice = new InterlayerNotice<PostsViewDto>

        const foundBlog = await this.blogsQueryRepository.findBlog(postInputData.blogId)
        if (!foundBlog) {
            notice.addError('blog is not found')
            return notice
        }

        const createdPost = await this.postsRepository.createPost(
            postInputData.title,
            postInputData.shortDescription,
            postInputData.content,
            postInputData.blogId,
            foundBlog.name
        )

        const mappedPost = await this.postQueryRepository.findPost(createdPost._id.toString())
        notice.addData(mappedPost)
        return notice
    }

    async updatePost(postId: string, updateData: PostInputDto) {
        const isUpdatedPost = await this.postsRepository.updatePost(postId, updateData)
        return isUpdatedPost.modifiedCount > 0
    }
    async deletePost(postId: string) {
        const isDeletedPost = await this.postsRepository.deletePost(postId)
        return isDeletedPost.modifiedCount > 0
    }
}