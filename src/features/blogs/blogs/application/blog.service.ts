import { Injectable } from '@nestjs/common';
import { BlogInputDto } from '../api/dto/input/blog-input.dto';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { BlogPostInputDto } from '../api/dto/input/blog-post-input.dto';
import { PostsRepository } from '../../posts/infrastructure/posts.repository';
import { PostsQueryRepository } from '../../posts/infrastructure/posts-query.repository';
import { PostsViewDto } from '../../posts/api/dto/output/extended-likes-info-view.dto';
import { InterlayerNotice, InterLayerStatuses } from '../../../../base/models/interlayer';

@Injectable()
export class BlogService {
    constructor(
        private readonly blogRepository: BlogsRepository,
        private readonly postsRepository: PostsRepository,
        private readonly postsQueryRepository: PostsQueryRepository,
    ) {}

    async createBlog(blogBody: BlogInputDto) {
        return await this.blogRepository.createBlog(blogBody)
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

        return await this.postsQueryRepository.findPost(createdPost.id)
    }

    async updatePostForBlog(blogId: string, blogPostBody: BlogPostInputDto, postId: string): Promise<InterlayerNotice<boolean>> {
        const notice = new InterlayerNotice<boolean>()

        const isPostBelongBlog = await this.postsRepository.checkIsPostBelongBlog(blogId, postId)
        if (!isPostBelongBlog) {
            notice.addError('blog did not find or post does not belong blog', 'blog', InterLayerStatuses.NOT_FOUND)
            return notice
        }

        const isUpdatedPost = await this.postsRepository.updatePostForBlog(
            postId,
            blogPostBody
        )

        if (!isUpdatedPost) {
            notice.addError('post did not updated', 'post', InterLayerStatuses.NOT_FOUND)
        }
        return notice
    }

    async deletePostForBlog(blogId: string, postId: string): Promise<InterlayerNotice<boolean>> {
        const notice = new InterlayerNotice<boolean>()

        const isPostBelongBlog = await this.postsRepository.checkIsPostBelongBlog(blogId, postId)
        if (!isPostBelongBlog) {
            notice.addError('blog did not find or post does not belong blog', 'blog', InterLayerStatuses.NOT_FOUND)
            return notice
        }

        const isDeletedPost = await this.postsRepository.deletePost( postId )

        if (!isDeletedPost) {
            notice.addError('post did not deleted', 'post', InterLayerStatuses.NOT_FOUND)
        }
        return notice
    }

    async updateBlog(blogId: string, updateData: BlogInputDto) {
        return await this.blogRepository.updateBlog(blogId, updateData)
    }
    async deleteBlog(blogId: string) {
        return await this.blogRepository.deleteBlog(blogId)
    }


}