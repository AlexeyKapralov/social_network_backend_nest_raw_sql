import { Injectable } from '@nestjs/common';
import { CommentsViewDto } from '../api/dto/output/commentsView.dto';
import { CommentsRepository } from '../infrastructure/comments.repository';
import { LikeStatus } from '../../likes/api/dto/output/likes-view.dto';
import { CommentInputDto } from '../api/dto/input/comment-input.dto';
import { LikeRepository } from '../../likes/repository/like.repository';
import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { InterlayerNotice, InterLayerStatuses } from '../../../../base/models/interlayer';
import { UserDocument } from '../../../users/domain/user.entity';

@Injectable()
export class CommentsService {
    constructor(
        private readonly commentsRepository: CommentsRepository,
        private readonly usersRepository: UsersRepository,
        private readonly likeRepository: LikeRepository,
    ) {}

    async getComment(
        commentId: string,
        userId?: string,
    ): Promise<InterlayerNotice<CommentsViewDto>> | null {
        const notice = new InterlayerNotice<CommentsViewDto>();

        const comment = await this.commentsRepository.getComment(commentId);
        if (!comment) {
            notice.addError(
                'comment was not found',
                '',
                InterLayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        const user: UserDocument = await this.usersRepository.findUserById(
            comment.userId,
        );
        if (!user) {
            notice.addError(
                'user was not found',
                '',
                InterLayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        let likeStatus = LikeStatus.None;
        try {
            const like = await this.likeRepository.findLikeByUserAndParent(
                userId,
                commentId,
            );
            likeStatus = like.likeStatus;
        } catch {}

        const mappedComment: CommentsViewDto = {
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            commentatorInfo: {
                userId: comment.userId,
                userLogin: user.login,
            },
            likesInfo: {
                likesCount: comment.likesCount,
                dislikesCount: comment.dislikesCount,
                myStatus: likeStatus,
            },
        };
        notice.addData(mappedComment);
        return notice;
    }

    async updateComment(
        userId: string,
        commentId: string,
        commentInputDto: CommentInputDto,
    ) {
        const notice = new InterlayerNotice<CommentsViewDto>();

        const comment = await this.commentsRepository.getComment(commentId);
        if (!comment) {
            notice.addError(
                'comment is not found',
                'user',
                InterLayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        const isUserOwner =
            await this.commentsRepository.checkIsUserOwnerForComment(
                userId,
                commentId,
            );
        if (!isUserOwner) {
            notice.addError(
                `user is not comment's owner`,
                'user',
                InterLayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const isUpdateComment = await this.commentsRepository.updateComment(
            userId,
            commentId,
            commentInputDto,
        );

        if (!isUpdateComment) {
            notice.addError(
                'comment was not updated',
                'comment',
                InterLayerStatuses.NOT_FOUND,
            );
            return notice;
        }
        return notice;
    }

    async deleteComment(userId: string, commentId: string) {
        const notice = new InterlayerNotice();

        const comment = await this.commentsRepository.getComment(commentId);
        if (!comment) {
            notice.addError(
                'comment is not found',
                'user',
                InterLayerStatuses.NOT_FOUND,
            );
            return notice;
        }

        const isUserOwner =
            await this.commentsRepository.checkIsUserOwnerForComment(
                userId,
                commentId,
            );
        if (!isUserOwner) {
            notice.addError(
                'user is not owner for comment',
                'user',
                InterLayerStatuses.FORBIDDEN,
            );
            return notice;
        }
        const isDeleteComment = await this.commentsRepository.deleteComment(
            userId,
            commentId,
        );

        if (!isDeleteComment) {
            notice.addError(
                'comment was not deleted',
                'comment',
                InterLayerStatuses.NOT_FOUND,
            );
            return notice;
        }
        return notice;
    }
}
