import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentDocument, CommentDocumentSql, CommentModelType } from '../domain/comment.entity';
import { CommentInputDto } from '../api/dto/input/comment-input.dto';
import { LikeStatus } from '../../likes/api/dto/output/likes-view.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CommentsRepository {
    constructor(
        // @InjectModel(Comment.name) private readonly commentModel: CommentModelType,
        @InjectDataSource() private dataSource: DataSource
    ) {
    }

    async getComment(commentId: string): Promise<CommentDocumentSql> {
        try {
            const comment = await this.dataSource.query(`
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
            return comment[0]
        } catch (e) {
            console.log('comments repo/get comment error', e)
            return null
        }
    }

    async createComment(postId: string, content: string, userId: string): Promise<CommentDocumentSql> {
        try {
            const comment = await this.dataSource.query(`
                INSERT INTO public.comments(
                    content, "userId", "postId", "dislikesCount", "likesCount", "isDeleted"
                ) 
                VALUES(
                    $1, $2, $3      
                )
                RETURNING "id", "postId", content, "userId", "createdAt", "dislikesCount", "likesCount"
            `, [content, userId, postId, 0, 0, false]
            )
            return comment[0]
        } catch (e) {
            console.log('blogRepo.createBlog error: ', e);
            return null
        }
    }

    async checkIsUserOwnerForComment(userId: string, commentId: string): Promise<boolean> {
        try {
            const comments = await this.dataSource.query(`
                SELECT id 
                FROM comments 
                WHERE id = $1 AND "userId" = $2 AND "isDeleted" = False
            `,
                [commentId, userId]
            )
            return comments[0] !== null
        } catch (e) {
            console.log('comments repo/get comment error', e)
            return false
        }

    }

    async updateComment(userId: string, commentId: string, commentInputDto: CommentInputDto): Promise<boolean> {

        try {
            const comment = await this.dataSource.query(`
                UPDATE public.comments
                SET content = $3
                WHERE id = $1 AND "userId" = $2 AND "isDeleted" = False
            `, [commentId, userId, commentInputDto.content],
            );
            //ответ будет в форме [ [data], [updated count ] ]
            return comment[1] > 0
        } catch (e) {
            console.log('comment repo/updateComment error: ', e);
            return false
        }
    }

    async deleteComment(userId: string, commentId: string): Promise<boolean> {
        // const isDeleteComment = await this.commentModel.updateOne(
        //     {
        //         _id: commentId,
        //         userId: userId,
        //     },
        //     { isDeleted: true },
        // );
        //
        // return isDeleteComment.modifiedCount > 0;

        try {
            const comment = await this.dataSource.query(`
                UPDATE public.comments
                SET "isDeleted" = True
                WHERE "isDeleted" = False AND "id" = $1 AND "userId" = $2
            `, [commentId, userId],
            );
            //ответ будет в форме [ [data], [updated count ] ]
            return comment[1] > 0
        } catch (e) {
            console.log('comment repo/delete comment error: ', e);
            return false
        }
    }

    async changeLikesAndDislikesCount(commentId: string, oldCommentStatus: LikeStatus, newCommentStatus: LikeStatus) {
        const comment = await this.getComment(commentId);

        let likesAction = 0
        let dislikesAction = 0
        switch (true) {
            case (newCommentStatus === LikeStatus.Like && oldCommentStatus === LikeStatus.Dislike) :
                likesAction = 1
                dislikesAction = -1
                break
            case (newCommentStatus === LikeStatus.Like && oldCommentStatus === LikeStatus.None):
                likesAction = 1
                // post.addCountDislikes(0)
                break
            case (newCommentStatus === LikeStatus.Dislike && oldCommentStatus === LikeStatus.Like):
                likesAction = -1
                dislikesAction = 1
                break
            case (newCommentStatus === LikeStatus.Dislike && oldCommentStatus === LikeStatus.None):
                dislikesAction = 1
                break
            case (newCommentStatus === LikeStatus.None && oldCommentStatus === LikeStatus.Like):
                likesAction = -1
                break
            case (newCommentStatus === LikeStatus.None && oldCommentStatus === LikeStatus.Dislike):
                dislikesAction = -1
                break
            default:
                break
        }

        try {
            const isChangeCountLikesAndDislikesForComments = await this.dataSource.query(`
                UPDATE public.comments
                SET "likesCount" = CAST("likesCount" AS INT) + $2, "dislikesCount" = CAST("dislikesCount" AS INT) + $3,
                WHERE "id" = $1 AND "isDeleted" = False;
            `, [
                    commentId,
                    likesAction,
                    dislikesAction
                ],
            );
            return isChangeCountLikesAndDislikesForComments[1] === 1;
        } catch (e) {
            console.log('comments repo.changeCountLikesAndDislikesCount error: ', e);
            return null
        }

        // await comment.save();
        // return true;

    }
}