import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Like, LikeDocument, LikeModelType } from '../domain/likes.entity';
import { LikeDetailsViewDto } from '../api/dto/output/likes-view.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class LikeQueryRepository {
    constructor(
        // @InjectModel(Like.name) private readonly likeModel: LikeModelType
        @InjectDataSource() private dataSource: DataSource
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
        // const likes = await this.likeModel.aggregate([
        //     {
        //         $addFields: {
        //             userId: { $toObjectId: "$userId" },
        //             parentId: { $toString: "$parentId" },
        //         }
        //     },
        //     {
        //         $match: {
        //             parentId: parentId
        //         }
        //     },
        //     {
        //         $lookup: {
        //             from: 'users',
        //             localField: 'userId',
        //             foreignField: '_id',
        //             pipeline: [
        //                 { $project: { _id: 0, login: 1 } }
        //             ],
        //             as: 'users'
        //         }
        //     },
        //     {
        //         $unwind: '$users'
        //     },
        //     {
        //         $project: {
        //             _id: 0,
        //             addedAt: '$createdAt',
        //             userId: { $toString: '$userId' },
        //             login: '$users.login'
        //         }
        //     },
        //     { $sort: { createdAt: -1 } },
        //     { $limit: limit }
        // ]).exec()

        try {
            const likes = await this.dataSource.query(
                `
                SELECT 
                    "likeStatus" AS description,
                    "createdAt" AS "addedAt",
                    "userId",
                    u.login
                FROM public.likes l
                LEFT JOIN public.users u ON u.id = l."userId"
                WHERE l."parentId" = $1
                ORDER BY l."createdAt" DESC
                LIMIT $2
            `,
                [parentId, limit],
            );
            return likes
        } catch (e) {
            console.log(' like query repository - get newest likes error: ',e)
            return null
        }
    }
}