import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Like, LikeDocument, LikeModelType } from '../domain/likes.entity';
import { LikeDetailsViewDto } from '../api/dto/output/likes-view.dto';

@Injectable()
export class LikeQueryRepository {
    constructor(
        @InjectModel(Like.name) private readonly likeModel: LikeModelType
    ) {}
    // async getLike(likeId: string): Promise<LikeDetailsViewDto> {
    //     return this.likeModel.findOne(
    //         { _id: likeId },
    //         {
    //             _id: 0,
    //             description: '$likeStatus',
    //             addedAt: '$createdAt',
    //             userId: 1,
    //             login: '$parentId'
    //         })
    // }

    async getNewestLikes(parentId: string, limit: number): Promise<LikeDetailsViewDto[]> {
        const likes = await this.likeModel.aggregate([
            {
                $addFields: {
                    userId: { $toObjectId: "$userId" },
                    parentId: { $toString: "$parentId" },
                }
            },
            {
                $match: {
                    parentId: parentId
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    pipeline: [
                        { $project: { _id: 0, login: 1 } }
                    ],
                    as: 'users'
                }
            },
            {
                $unwind: '$users'
            },
            {
                $project: {
                    _id: 0,
                    addedAt: '$createdAt',
                    userId: { $toString: '$userId' },
                    login: '$users.login'
                }
            },
            { $sort: { createdAt: -1 } },
            { $limit: limit }
        ]).exec()

        return likes
    }
}