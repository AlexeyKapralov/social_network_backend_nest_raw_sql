import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { LikeStatus } from '../api/dto/output/likes-view.dto';

@Schema()
export class Like {
    @Prop()
    userId: string
    @Prop()
    parentId: string
    @Prop()
    createdAt: string
    @Prop()
    likeStatus: LikeStatus

    static createLike(
        userId: string,
        parentId: string,//может быть и для поста и для комментария
        likeStatus?: LikeStatus
    ) {
        const like = new this()

        like.userId = userId
        like.parentId = parentId
        like.createdAt = new Date().toISOString()
        like.likeStatus = likeStatus ?? LikeStatus.None
        return like
    }

    static async saveLike(likeDocument: LikeDocument) {
        await likeDocument.save()
    }

}

export const LikeSchema = SchemaFactory.createForClass(Like)

LikeSchema.methods = {
    // saveLike: Like.prototype.saveLike
}

LikeSchema.statics = {
    createLike: Like.createLike,
    saveLike: Like.saveLike
}

type LikeStaticType = {
    createLike(
        userId: string,
        postId: string,
        likeStatus?: LikeStatus
    ): LikeDocument
    saveLike(likeDocument: LikeDocument): Promise<void>
}

export type LikeDocument = HydratedDocument<Like>
export type LikeModelType = Model<LikeDocument> & LikeStaticType
