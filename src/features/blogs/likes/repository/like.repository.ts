import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Like, LikeDocument, LikeModelType } from '../domain/likes.entity';
import { LikeStatus } from '../api/dto/output/likes-view.dto';

@Injectable()
export class LikeRepository {
    constructor(
        @InjectModel(Like.name) private readonly likeModel: LikeModelType
    ) {}
    async createLike(userId: string, parentId: string, likeStatus: LikeStatus = LikeStatus.None): Promise<LikeDocument> {

        const like: LikeDocument = this.likeModel.createLike(userId, parentId, likeStatus)

        await this.likeModel.saveLike(like)
        return like
    }

    async changeLikeStatus(userId: string, parentId: string, likeStatus: LikeStatus): Promise<LikeDocument> {
        let like = await this.findLikeByUserAndParent(userId, parentId)

        if (!like) {
            throw new Error('like does not exist (LikeRepository.changeLikeStatus)')
        }

        like.likeStatus = likeStatus
        await this.likeModel.saveLike(like)
        return like
    }

    /*
    * найти комментарий по userId и по ParentId ( PostId или CommentId)
    * */
    async findLikeByUserAndParent(userId: string, parentId: string): Promise<LikeDocument> {
        return this.likeModel.findOne(
            {userId: userId, parentId: parentId}
        )
    }

}