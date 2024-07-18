import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentDocument, CommentModelType } from '../domain/comment.entity';
import { Like, LikeDocument, LikeModelType } from '../../likes/domain/likes.entity';
import { CommentsViewDto } from '../api/dto/output/commentsView.dto';
import { LikeStatus } from '../../likes/api/dto/output/likes-view.dto';
import { User, UserDocument, UserModelType } from '../../../users/domain/user.entity';
import { InterlayerNotice } from '../../../../base/models/interlayer';

@Injectable()
export class CommentsQueryRepository {

    constructor(
        @InjectModel(Comment.name) private readonly commentModel: CommentModelType,
        @InjectModel(User.name) private readonly userModel: UserModelType,
        @InjectModel(Like.name) private readonly likeModel: LikeModelType
    ) {}

    /*
    * получить комментарий и информацию о юзере и статус его лайка
    * */
    async getComment(commentId: string, userId: string): Promise<InterlayerNotice<CommentsViewDto>> {
        const notice = new InterlayerNotice<CommentsViewDto>

        let comment: CommentDocument = await this.commentModel.findOne({_id: commentId, isDeleted: false}).exec()
        let user: UserDocument = await this.userModel.findOne({_id: userId, isDeleted: false}).exec()
        let like: LikeDocument = await this.likeModel.findOne( {parentId: commentId } )

        if (!comment || !user) {
            notice.addError('smt not found')
            return notice
        }

        const mappedComment: CommentsViewDto = {
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            commentatorInfo: {
                userId: user._id.toString(),
                userLogin: user.login
            },
            likesInfo: {
                likesCount: comment.likesCount,
                dislikesCount: comment.dislikesCount,
                myStatus: like ? like.likeStatus : LikeStatus.None
            }
        }

        notice.addData(mappedComment)

        return notice
    }

}