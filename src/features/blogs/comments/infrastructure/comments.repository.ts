import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentDocument, CommentModelType } from '../domain/comment.entity';
import { CommentInputDto } from '../api/dto/input/comment-input.dto';
import { LikeStatus } from '../../likes/api/dto/output/likes-view.dto';

@Injectable()
export class CommentsRepository {
    constructor(
        @InjectModel(Comment.name) private readonly commentModel: CommentModelType,
    ) {
    }

    async getComment(commentId: string) {
        return this.commentModel.findOne(
            { _id: commentId, isDeleted: false },
        );
    }

    async createComment(postId: string, content: string, userId: string): Promise<CommentDocument> {
        const createdComment = this.commentModel.createComment(content, userId, postId);
        await createdComment.save();
        return createdComment;
    }

    async checkIsUserOwnerForComment(userId: string, commentId: string) {
        const comment = await this.commentModel.findOne(
            {
                _id: commentId,
                userId: userId,
                isDeleted: false,
            },
        );

        return !!comment;
    }

    async updateComment(userId: string, commentId: string, commentInputDto: CommentInputDto) {
        const isUpdateComment = await this.commentModel.updateOne(
            {
                _id: commentId,
                userId: userId,
                isDeleted: false,
            },
            {
                content: commentInputDto.content,
            },
        );

        return isUpdateComment.modifiedCount > 0;
    }

    async deleteComment(userId: string, commentId: string) {
        const isDeleteComment = await this.commentModel.updateOne(
            {
                _id: commentId,
                userId: userId,
            },
            { isDeleted: true },
        );

        return isDeleteComment.modifiedCount > 0;
    }

    async changeLikesAndDislikesCount(commentId: string, oldCommentStatus: LikeStatus, newCommentStatus: LikeStatus) {
        const comment = await this.getComment(commentId);

        switch (true) {
            case (newCommentStatus === LikeStatus.Like && oldCommentStatus === LikeStatus.Dislike) :
                comment.addCountLikes(1);
                comment.addCountDislikes(-1);
                break
            case (newCommentStatus === LikeStatus.Like && oldCommentStatus === LikeStatus.None):
                comment.addCountLikes(1);
                break
            case (newCommentStatus === LikeStatus.Dislike && oldCommentStatus === LikeStatus.Like):
                comment.addCountLikes(-1);
                comment.addCountDislikes(1);
                break
            case (newCommentStatus === LikeStatus.Dislike && oldCommentStatus === LikeStatus.None):
                comment.addCountDislikes(1);
                break
            case (newCommentStatus === LikeStatus.None && oldCommentStatus === LikeStatus.Like):
                comment.addCountLikes(-1);
                break
            case (newCommentStatus === LikeStatus.None && oldCommentStatus === LikeStatus.Dislike):
                comment.addCountDislikes(-1);
                break
        }

        await comment.save();
        return true;

    }
}