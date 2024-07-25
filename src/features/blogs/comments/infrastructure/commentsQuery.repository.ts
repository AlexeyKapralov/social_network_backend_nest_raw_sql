import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentDocument, CommentDocumentSql, CommentModelType } from '../domain/comment.entity';
import { Like, LikeDocument, LikeDocumentSql, LikeModelType } from '../../likes/domain/likes.entity';
import { CommentsViewDto } from '../api/dto/output/commentsView.dto';
import { LikeStatus } from '../../likes/api/dto/output/likes-view.dto';
import { User, UserDocument, UserDocumentSql, UserModelType } from '../../../users/domain/user.entity';
import { InterlayerNotice } from '../../../../base/models/interlayer';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CommentsQueryRepository {

    constructor(
        // @InjectModel(Comment.name) private readonly commentModel: CommentModelType,
        // @InjectModel(User.name) private readonly userModel: UserModelType,
        // @InjectModel(Like.name) private readonly likeModel: LikeModelType
        @InjectDataSource() private dataSource: DataSource
    ) {}

    /*
    * получить комментарий и информацию о юзере и статус его лайка
    * */
    async getComment(commentId: string, userId: string): Promise<InterlayerNotice<CommentsViewDto>> {
        const notice = new InterlayerNotice<CommentsViewDto>


        //todo рефакторинг на один запрос вместо двух

        // let comment: CommentDocument = await this.commentModel.findOne({_id: commentId, isDeleted: false}).exec()
        let comment: CommentDocumentSql
        try {
            comment = await this.dataSource.query(`
            SELECT 
                 "id",
                 "postId",
                 "content",
                 "userId",
                 "createdAt",
                 "likesCount",
                 "dislikesCount"
            FROM comments 
            WHERE id = $1 AND "isDeleted" = False
        `,
                [commentId]
            )
            comment = comment[0]
        } catch (e) {
            console.log('comment query repo/get comment error', e)
            return null
        }
        // let user: UserDocument = await this.userModel.findOne({_id: userId, isDeleted: false}).exec()
        let user: UserDocumentSql
        try {
            user = await this.dataSource.query(`
            SELECT 
                id,
                password,
                email,  
                login, 
                "createdAt",
                "confirmationCode"
            FROM public.users 
            WHERE 
                "id" = $1 AND "isDeleted" = False
        `, [userId],
            );
            user = user[0]
        } catch (e) {
            console.log('comment query repo/get user error', e);
            return null
        }
        // let like: LikeDocument = await this.likeModel.findOne( {parentId: commentId } )
        let like: LikeDocumentSql
        try {
            like = await this.dataSource.query(`
                SELECT 
                    "id",
                    "userId",
                    "parentId",
                    "createdAt",
                    "likeStatus"
                FROM public.likes 
                WHERE 
                    "parentId" = $1
            `, [commentId],
            );
            like = like[0]
        } catch (e) {
            console.log('comment query repo/get like error', e);
            return null
        }

        if (!comment || !user) {
            notice.addError('smt not found')
            return notice
        }

        const mappedComment: CommentsViewDto = {
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            commentatorInfo: {
                userId: user.id,
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