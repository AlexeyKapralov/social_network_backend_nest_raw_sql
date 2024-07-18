import { Injectable } from '@nestjs/common';
import { Post, PostDocument, PostModelType } from '../domain/posts.entity';
import { InjectModel } from '@nestjs/mongoose';
import { PostInputDto } from '../api/dto/input/post-input.dto';
import { LikeStatus } from '../../likes/api/dto/output/likes-view.dto';

@Injectable()
export class PostsRepository {

    constructor(
        @InjectModel(Post.name) private postModel: PostModelType,
    ) {
    }

    async findPost(postId: string): Promise<PostDocument> {
        return this.postModel.findOne({ _id: postId, isDeleted: false });
    }

    async createPost(
        title: string,
        shortDescription: string,
        content: string,
        blogId: string,
        blogName: string,
    ) {
        const post = this.postModel.createPost(
            title,
            shortDescription,
            content,
            blogId,
            blogName,
        );
        await post.save()
        return post
    }

    async updatePost(postId: string, postUpdateData: PostInputDto) {
        return this.postModel.updateOne(
            { _id: postId, isDeleted: false },
            { ...postUpdateData },
        );
    }

    async deletePost(postId: string) {
        return this.postModel.updateOne({
                _id: postId, isDeleted: false,
            },
            {
                isDeleted: true,
            });
    }

    async changeLikesAndDislikesCount(postId: string, oldLikeStatus: LikeStatus, newLikeStatus: LikeStatus) {
        const post = await this.findPost(postId);

        switch (true) {
            case (newLikeStatus === LikeStatus.Like && oldLikeStatus === LikeStatus.Dislike) :
                post.addCountLikes(1);
                post.addCountDislikes(-1);
                await post.save();
                return true
            case (newLikeStatus === LikeStatus.Like && oldLikeStatus === LikeStatus.None):
                post.addCountLikes(1);
                // post.addCountDislikes(0)
                await post.save();
                return true;
            case (newLikeStatus === LikeStatus.Dislike && oldLikeStatus === LikeStatus.Like):
                post.addCountLikes(-1);
                post.addCountDislikes(1);
                await post.save();
                return true;
            case (newLikeStatus === LikeStatus.Dislike && oldLikeStatus === LikeStatus.None):
                post.addCountDislikes(1);
                await post.save();
                return true;
            case (newLikeStatus === LikeStatus.None && oldLikeStatus === LikeStatus.Like):
                post.addCountLikes(-1);
                await post.save();
                return true;
            case (newLikeStatus === LikeStatus.None && oldLikeStatus === LikeStatus.Dislike):
                post.addCountDislikes(-1);
                await post.save();
                return true;
            default:
                return true;
        }

    }
}