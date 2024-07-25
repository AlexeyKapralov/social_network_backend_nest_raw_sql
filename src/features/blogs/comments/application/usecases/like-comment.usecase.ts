import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { CommentDocument, CommentDocumentSql } from '../../domain/comment.entity';
import { LikeDocument, LikeDocumentSql } from '../../../likes/domain/likes.entity';
import { LikeRepository } from '../../../likes/repository/like.repository';
import { LikeStatus } from '../../../likes/api/dto/output/likes-view.dto';
import { InterlayerNotice, InterLayerStatuses } from '../../../../../base/models/interlayer';

export class LikeCommentCommand {
    constructor(
        public commentId: string,
        public userId: string,
        public likeStatus: LikeStatus
    ) {}
}

@CommandHandler(LikeCommentCommand)
export class LikeCommentUseCase implements ICommandHandler<
    LikeCommentCommand,
    InterlayerNotice
> {
    constructor(
        private readonly commentsRepository: CommentsRepository,
        private readonly likeRepository: LikeRepository,
    ) {}

    async execute(command: LikeCommentCommand): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice

        const comment: CommentDocumentSql  = await this.commentsRepository.getComment(
            command.commentId
        )
        if (!comment) {
            notice.addError(`comment did not find`, 'comment', InterLayerStatuses.NOT_FOUND)
            return notice
        }

        let like: LikeDocumentSql = await this.likeRepository.findLikeByUserAndParent(command.userId, command.commentId)
        if (!like) {
            like  = await this.likeRepository.createLike(command.userId, command.commentId, LikeStatus.None)
        }
        if (!like) {
            throw new Error(`like didn't create`)
        }
        const newLike: LikeDocument = await this.likeRepository.changeLikeStatus(
            command.userId,
            command.commentId,
            command.likeStatus
        )
        if (!newLike) {
            throw new Error('Some problem with likeRepository.changeLikeStatus or likeRepository.findLikeByUserAndParent')
        }

        //обновление комментария
        const isChangeLikeStatusComment = await this.commentsRepository.changeLikesAndDislikesCount(command.commentId, like.likeStatus, command.likeStatus)
        if (!isChangeLikeStatusComment) {
            throw new Error('There was no change in status in comment. Some problem with commentsRepository.changeLikesAndDislikesCount ')
        }

        return notice
    }
}

// export type LikeCommentResultType = {
//     isLikeSucces: boolean
// }