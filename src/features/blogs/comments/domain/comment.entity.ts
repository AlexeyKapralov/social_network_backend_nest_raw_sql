import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

@Schema()
export class Comment {
    @Prop()
    postId: string
    @Prop()
    content: string
    @Prop()
    userId: string
    @Prop()
    createdAt: string
    @Prop()
    likesCount: number
    @Prop()
    dislikesCount: number
    @Prop()
    isDeleted: boolean

    static createComment(
        content: string,
        userId: string,
        postId: string
    ) {
        const comment = new this()

        comment.content = content
        comment.userId = userId
        comment.postId = postId
        comment.createdAt = new Date().toISOString()
        comment.dislikesCount = 0
        comment.likesCount = 0
        comment.isDeleted = false
        return comment
    }

    addCountLikes(count: number) {
        this.likesCount += count
    }

    addCountDislikes(count: number) {
        this.dislikesCount += count
    }

}

export const CommentSchema = SchemaFactory.createForClass(Comment)

CommentSchema.statics = {
    createComment: Comment.createComment,
}
CommentSchema.methods = {
    addCountLikes: Comment.prototype.addCountLikes,
    addCountDislikes: Comment.prototype.addCountDislikes
}

type CommentStaticType = {
    createComment(
        content: string,
        userId: string,
        postId: string
    ): CommentDocument
}

export type CommentDocument = HydratedDocument<Comment>
export type CommentModelType = Model<CommentDocument> & CommentStaticType


export type CommentDocumentSql = {
    id: string
    postId: string
    content: string
    userId: string
    createdAt: string
    likesCount: number
    dislikesCount: number
}