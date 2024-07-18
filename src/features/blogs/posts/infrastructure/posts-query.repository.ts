import { Post, PostModelType } from '../domain/posts.entity';
import { InjectModel } from '@nestjs/mongoose';
import { PostsViewDto } from '../api/dto/output/extended-likes-info-view.dto';
import { LikeStatus } from '../../likes/api/dto/output/likes-view.dto';
import { Injectable } from '@nestjs/common';
import { LikeQueryRepository } from '../../likes/repository/like-query.repository';
import { User, UserModelType } from '../../../users/domain/user.entity';
import { QueryDtoBase } from '../../../../common/dto/query.dto';
import { Paginator } from '../../../../common/dto/paginator.dto';

@Injectable()
export class PostsQueryRepository {
    constructor(
        @InjectModel(Post.name) private postModel: PostModelType,
        @InjectModel(User.name) private userModel: UserModelType,
        private readonly likeQueryRepository: LikeQueryRepository,
    ) {}

    async findPosts(query: QueryDtoBase, userId: string = '') {
        const countPosts = await this.postModel
            .find({ isDeleted: false })
            .countDocuments();

        const posts = await this.postModel.aggregate([
            {
                $addFields: {
                    _id: { $toString: '$_id' },
                },
            },
            {
                $match: {
                    isDeleted: false,
                },
            },
            {
                $lookup: {
                    from: 'likes',
                    localField: '_id',
                    foreignField: 'parentId',
                    pipeline: [
                        { $match: { userId: userId } },
                        { $project: { _id: 0, likeStatus: 1 } },
                    ],
                    as: 'likes',
                },
            },
            {
                $addFields: {
                    myStatus: { $arrayElemAt: ['$likes.likeStatus', 0] },
                },
            },
            {
                $project: {
                    likes: 0,
                },
            },
            {
                $lookup: {
                    from: 'likes',
                    localField: '_id',
                    foreignField: 'parentId',
                    pipeline: [
                        {
                            $addFields: {
                                userId: { $toObjectId: '$userId' },
                            },
                        },
                        {
                            $match: { likeStatus: LikeStatus.Like },
                        },
                        {
                            $project: {
                                _id: 0,
                                addedAt: '$createdAt',
                                userId: 1,
                            },
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'userId',
                                foreignField: '_id',
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 0,
                                            login: 1,
                                        },
                                    },
                                ],
                                as: 'users',
                            },
                        },
                        {
                            $project: {
                                login: { $arrayElemAt: ['$users.login', 0] },
                                userId: 1,
                                addedAt: 1,
                            },
                        },
                        { $sort: { addedAt: -1 } },
                        { $limit: 3 },
                    ],
                    as: 'newestLikes',
                },
            },
            { $sort: { [query.sortBy]: query.sortDirection as 1 | -1 } },
            { $skip: (query.pageNumber - 1) * query.pageSize },
            { $limit: query.pageSize },
            {
                $project: {
                    _id: 0,
                    id: { $toString: '$_id' },
                    title: 1,
                    shortDescription: 1,
                    content: 1,
                    blogId: 1,
                    blogName: 1,
                    createdAt: 1,
                    'extendedLikesInfo.likesCount': '$likesCount',
                    'extendedLikesInfo.dislikesCount': '$dislikesCount',
                    'extendedLikesInfo.myStatus': {
                        $ifNull: ['$myStatus', LikeStatus.None],
                    },
                    'extendedLikesInfo.newestLikes': '$newestLikes',
                },
            },
        ]);

        // const posts = await this.postModel.aggregate([
        //         {
        //             $addFields: {
        //                 _postIdString: { $toString: '$_id' },
        //             },
        //         },
        //         {
        //             $match: {
        //                 isDeleted: false,
        //             },
        //         },
        //         {
        //             $lookup: {
        //                 from: 'likes',
        //                 localField: '_postIdString',
        //                 foreignField: 'parentId',
        //                 pipeline: [
        //                     { $match: { userId: userId } },
        //                     { $project: { _id: 0, likeStatus: 1 } },
        //                 ],
        //                 as: 'likes',
        //             },
        //         },
        //         { $sort: { [query.sortBy]: query.sortDirection as 1 | -1 } },
        //         { $skip: (query.pageNumber - 1) * query.pageSize },
        //         { $limit: query.pageSize },
        //     ],
        // ).exec();

        // let mappedPosts: PostsViewDto[] = [];
        // await Promise.all(
        //     posts.map(
        //         async (
        //             post: PostDocument & {
        //                 likes: { likeStatus: LikeStatus }[];
        //             },
        //         ) => {
        //             let likeStatus: LikeStatus = LikeStatus.None;
        //             if (post.likes.length !== 0) {
        //                 likeStatus = post.likes[0].likeStatus;
        //             }
        //
        //             mappedPosts.push({
        //                 id: post._id.toString(),
        //                 title: post.title,
        //                 shortDescription: post.shortDescription,
        //                 content: post.content,
        //                 blogId: post.blogId,
        //                 blogName: post.blogName,
        //                 createdAt: post.createdAt,
        //                 extendedLikesInfo: {
        //                     likesCount: post.likesCount,
        //                     dislikesCount: post.dislikesCount,
        //                     myStatus: likeStatus,
        //                     newestLikes: [],
        //                 },
        //             });
        //         },
        //     ),
        // );

        const postsWithPaginate: Paginator<PostsViewDto> = {
            pagesCount: Math.ceil(countPosts / query.pageSize),
            page: query.pageNumber,
            pageSize: query.pageSize,
            totalCount: countPosts,
            items: posts,
        };

        return postsWithPaginate;
    }

    async findPostsForBlog(
        query: QueryDtoBase,
        blogId: string,
        userId: string = '',
    ) {
        const countPosts = await this.postModel
            .find({ blogId: blogId, isDeleted: false })
            .countDocuments();
        // const posts: PostDocument[] = await this.postModel.aggregate([
        //     {
        //         $match: {
        //             blogId: blogId,
        //             isDeleted: false,
        //         },
        //     },
        //     { $sort: { [query.sortBy]: query.sortDirection as 1 | -1 } },
        //     { $skip: (query.pageNumber - 1) * query.pageSize },
        //     { $limit: query.pageSize },
        // ]).exec();

        let posts = [];
        posts = await this.postModel
            .aggregate([
                {
                    $addFields: {
                        _id: { $toString: '$_id' },
                    },
                },
                {
                    $match: {
                        blogId: blogId,
                        isDeleted: false,
                    },
                },
                {
                    $lookup: {
                        from: 'likes',
                        localField: '_id',
                        foreignField: 'parentId',
                        pipeline: [
                            { $match: { userId: userId } },
                            { $project: { _id: 0, likeStatus: 1 } },
                        ],
                        as: 'likes',
                    },
                },
                {
                    $addFields: {
                        myStatus: {
                            $arrayElemAt: ['$likes.likeStatus', 0],
                        },
                    },
                },
                {
                    $project: {
                        likes: 0,
                    },
                },
                {
                    $lookup: {
                        from: 'likes',
                        localField: '_id',
                        foreignField: 'parentId',
                        pipeline: [
                            {
                                $addFields: {
                                    userId: { $toObjectId: '$userId' },
                                },
                            },
                            {
                                $match: { likeStatus: LikeStatus.Like },
                            },
                            {
                                $project: {
                                    _id: 0,
                                    addedAt: '$createdAt',
                                    userId: 1,
                                },
                            },
                            {
                                $lookup: {
                                    from: 'users',
                                    localField: 'userId',
                                    foreignField: '_id',
                                    pipeline: [
                                        {
                                            $project: {
                                                _id: 0,
                                                login: 1,
                                            },
                                        },
                                    ],
                                    as: 'users',
                                },
                            },
                            {
                                $project: {
                                    login: {
                                        $arrayElemAt: ['$users.login', 0],
                                    },
                                    userId: 1,
                                    addedAt: 1,
                                },
                            },
                            { $sort: { addedAt: -1 } },
                            { $limit: 3 },
                        ],
                        as: 'newestLikes',
                    },
                },
                { $sort: { [query.sortBy]: query.sortDirection as 1 | -1 } },
                { $skip: (query.pageNumber - 1) * query.pageSize },
                { $limit: query.pageSize },
                {
                    $project: {
                        _id: 0,
                        id: { $toString: '$_id' },
                        title: 1,
                        shortDescription: 1,
                        content: 1,
                        blogId: 1,
                        blogName: 1,
                        createdAt: 1,
                        'extendedLikesInfo.likesCount': '$likesCount',
                        'extendedLikesInfo.dislikesCount': '$dislikesCount',
                        'extendedLikesInfo.myStatus': {
                            $ifNull: ['$myStatus', LikeStatus.None],
                        },
                        'extendedLikesInfo.newestLikes': '$newestLikes',
                    },
                },
            ])
            .exec();

        const postsWithPaginate: Paginator<PostsViewDto> = {
            pagesCount: Math.ceil(countPosts / query.pageSize),
            page: query.pageNumber,
            pageSize: query.pageSize,
            totalCount: countPosts,
            items: posts,
        };

        return postsWithPaginate;
    }

    async findPost(postId: string, userId: string = ''): Promise<PostsViewDto> {
        const posts = await this.postModel
            .aggregate([
                {
                    $addFields: {
                        _id: { $toString: '$_id' },
                    },
                },
                {
                    $match: {
                        _id: postId,
                        isDeleted: false,
                    },
                },
                {
                    $lookup: {
                        from: 'likes',
                        localField: '_id',
                        foreignField: 'parentId',
                        pipeline: [
                            { $match: { userId: userId } },
                            { $project: { _id: 0, likeStatus: 1 } },
                        ],
                        as: 'likes',
                    },
                },
                {
                    $addFields: {
                        myStatus: { $arrayElemAt: ['$likes.likeStatus', 0] },
                    },
                },
                {
                    $project: {
                        likes: 0,
                    },
                },
                {
                    $lookup: {
                        from: 'likes',
                        localField: '_id',
                        foreignField: 'parentId',
                        pipeline: [
                            {
                                $addFields: {
                                    userId: { $toObjectId: '$userId' },
                                },
                            },
                            {
                                $match: { likeStatus: LikeStatus.Like },
                            },
                            {
                                $project: {
                                    _id: 0,
                                    addedAt: '$createdAt',
                                    userId: 1,
                                },
                            },
                            {
                                $lookup: {
                                    from: 'users',
                                    localField: 'userId',
                                    foreignField: '_id',
                                    pipeline: [
                                        {
                                            $project: {
                                                _id: 0,
                                                login: 1,
                                            },
                                        },
                                    ],
                                    as: 'users',
                                },
                            },
                            {
                                $project: {
                                    login: {
                                        $arrayElemAt: ['$users.login', 0],
                                    },
                                    userId: 1,
                                    addedAt: 1,
                                },
                            },
                            { $sort: { addedAt: -1 } },
                            { $limit: 3 },
                        ],
                        as: 'newestLikes',
                    },
                },
                {
                    $project: {
                        _id: 0,
                        id: { $toString: '$_id' },
                        title: 1,
                        shortDescription: 1,
                        content: 1,
                        blogId: 1,
                        blogName: 1,
                        createdAt: 1,
                        'extendedLikesInfo.likesCount': '$likesCount',
                        'extendedLikesInfo.dislikesCount': '$dislikesCount',
                        'extendedLikesInfo.myStatus': {
                            $ifNull: ['$myStatus', LikeStatus.None],
                        },
                        'extendedLikesInfo.newestLikes': '$newestLikes',
                    },
                },
            ])
            .exec();

        if (posts.length === 0) {
            return null;
        }

        return posts[0];
    }
}
