import { ExtendedLikesInfoViewDto, PostsViewDto } from '../api/dto/output/extended-likes-info-view.dto';
import { LikeDetailsViewDto, LikeStatus } from '../../likes/api/dto/output/likes-view.dto';
import { Injectable } from '@nestjs/common';
import { QueryDtoBase, SortDirection } from '../../../../common/dto/query.dto';
import { Paginator } from '../../../../common/dto/paginator.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import e from 'express';
import { Post, PostDocumentSql, PostModelType } from '../domain/posts.entity';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class PostsQueryRepository {
    constructor(
        // @InjectModel(Post.name) private postModel: PostModelType,
        @InjectDataSource() private dataSource: DataSource,
    ) {}

    async findPosts(query: QueryDtoBase, userId: string = '00000000-0000-0000-0000-000000000000') {
        // const countPosts = await this.postModel
        //     .find({ isDeleted: false })
        //     .countDocuments();
        if (!userId) {
            userId = '00000000-0000-0000-0000-000000000000'
        }
        let countPosts = 0
        try {
            countPosts = await this.dataSource.query(
                `
                SELECT COUNT(*)
                FROM public.posts
                WHERE "isDeleted" = False
            `,
                []
            );
            countPosts = Number(countPosts[0].count);
        } catch {
            console.log('postsQueryRepo.findPosts error: ', e)
            return null
        }

        const allowedSortFields = [
            "id",
            "title",
            "shortDescription",
            "content",
            "createdAt",
            "likesCount",
            "dislikesCount"
        ];
        let sortBy = `"${query.sortBy}"`
        if (sortBy !== '"createdAt"') {
            sortBy = allowedSortFields.includes(query.sortBy) ? `"${query.sortBy}" COLLATE "C" ` : `"createdAt"`
        }

        let sortDirection = SortDirection.DESC;
        switch (query.sortDirection) {
            case 1:
                sortDirection = SortDirection.ASC;
                break
            case -1:
                sortDirection = SortDirection.DESC;
                break
        }

        //todo чтобы получить посты нужно
        // 1. сделать запрос для постов без трех новых лайков
        let postsSourceWithoutNewestLikes: Array<Omit<PostsViewDto, "extendedLikesInfo"> & Omit<ExtendedLikesInfoViewDto, 'newestLikes'>> = []
        try {
            postsSourceWithoutNewestLikes = await this.dataSource.query(`
                SELECT 
                    p.id,
                    p.title,
                    p."shortDescription",
                    p.content,
                    p."blogId",
                    b."name" AS "blogName",
                    p."createdAt",
                    p."likesCount",
                    p."dislikesCount",
                    CASE 
                        WHEN l."likeStatus" IS NULL THEN $1
                        ElSE l."likeStatus"
                    END AS "myStatus"
                FROM posts p
                LEFT JOIN public.blogs b ON p."blogId" = b.id
                LEFT JOIN (
                    SELECT * 
                    FROM public.likes
                    WHERE likes."userId"= $2
                ) l ON l."parentId" = p.id
                ORDER BY ${sortBy} ${sortDirection}
                `,
                [
                    LikeStatus.None,
                    userId
                ],
            );
        } catch {
            console.log('postsQueryRepo.findPosts error:', e);
            return null
        }
        //todo 2. сделать запрос для постов с тремя лайками
        let postsSourceWithNewestLikes: Array<Omit<PostsViewDto, "extendedLikesInfo"> & LikeDetailsViewDto> & {
            addedAt: string;
            userId: string;
            login: string;
        } [] = []
        try {
            postsSourceWithNewestLikes = await this.dataSource.query(`
                SELECT 
                    p.id,
                    p.title,
                    p."shortDescription",
                    p.content,
                    p."blogId",
                    b."name" AS "blogName",
                    p."createdAt",
                    p."likesCount",
                    p."dislikesCount",
                    CASE 
                        WHEN l."likeStatus" IS NULL THEN $1
                        ElSE l."likeStatus"
                    END AS "myStatus",
                    nl."addedAt",
                    nl."userId",
                    nl.login,
                    nl."description"
                FROM posts p
                LEFT JOIN public.blogs b ON p."blogId" = b.id
                LEFT JOIN (
                    SELECT * 
                    FROM public.likes
                    WHERE likes."userId"= $2
                ) l ON l."parentId" = p."id"
                LEFT JOIN (
                    SELECT 
                        l."createdAt" AS "addedAt",
                        l."likeStatus" AS "description",
                        l."userId",
                        u.login, 
                        l."parentId"
                    FROM public.likes l
                    LEFT JOIN public.users u ON u.id = l."userId" 
                    WHERE l."likeStatus" = $3   
                    ORDER BY l."createdAt" DESC
                    LIMIT 3
                ) AS nl ON nl."parentId" = p.id
                `,
                [
                    LikeStatus.None,
                    userId,
                    LikeStatus.Like
                ],
            );
        } catch {
            console.log('postsQueryRepo.findPosts error:', e);
            return null
        }
        //todo 3. замапить эти два объекта в коде в тот вид, который нужен
        const posts: PostsViewDto[] = []
        postsSourceWithoutNewestLikes.map( postWithNoLikes => {
            const likes/*: LikeDetailsViewDto*/ = postsSourceWithNewestLikes.filter( (p) =>
                (
                    p.id === postWithNoLikes.id &&
                     p.description === LikeStatus.Like
                )
            ).map( p => {
                return {
                    description: p.description,
                    login: p.login,
                    userId: p.userId,
                    addedAt: p.addedAt
                }
            } )
            const fullPost: PostsViewDto = {
                id: postWithNoLikes.id,
                blogId: postWithNoLikes.blogId,
                blogName: postWithNoLikes.blogName,
                content: postWithNoLikes.content,
                createdAt: postWithNoLikes.createdAt,
                title: postWithNoLikes.title,
                shortDescription: postWithNoLikes.shortDescription,
                extendedLikesInfo: {
                    myStatus: postWithNoLikes.myStatus,
                    likesCount: postWithNoLikes.likesCount,
                    dislikesCount: postWithNoLikes.dislikesCount,
                    newestLikes: likes
                }
            }
            posts.push(fullPost)
        } )

        // const posts = await this.postModel.aggregate([
        //     {
        //         $addFields: {
        //             _id: { $toString: '$_id' },
        //         },
        //     },
        //     {
        //         $match: {
        //             isDeleted: false,
        //         },
        //     },
        //     {
        //         $lookup: {
        //             from: 'likes',
        //             localField: '_id',
        //             foreignField: 'parentId',
        //             pipeline: [
        //                 { $match: { userId: userId } },
        //                 { $project: { _id: 0, likeStatus: 1 } },
        //             ],
        //             as: 'likes',
        //         },
        //     },
        //     {
        //         $addFields: {
        //             myStatus: { $arrayElemAt: ['$likes.likeStatus', 0] },
        //         },
        //     },
        //     {
        //         $project: {
        //             likes: 0,
        //         },
        //     },
        //     {
        //         $lookup: {
        //             from: 'likes',
        //             localField: '_id',
        //             foreignField: 'parentId',
        //             pipeline: [
        //                 {
        //                     $addFields: {
        //                         userId: { $toObjectId: '$userId' },
        //                     },
        //                 },
        //                 {
        //                     $match: { likeStatus: LikeStatus.Like },
        //                 },
        //                 {
        //                     $project: {
        //                         _id: 0,
        //                         addedAt: '$createdAt',
        //                         userId: 1,
        //                     },
        //                 },
        //                 {
        //                     $lookup: {
        //                         from: 'users',
        //                         localField: 'userId',
        //                         foreignField: '_id',
        //                         pipeline: [
        //                             {
        //                                 $project: {
        //                                     _id: 0,
        //                                     login: 1,
        //                                 },
        //                             },
        //                         ],
        //                         as: 'users',
        //                     },
        //                 },
        //                 {
        //                     $project: {
        //                         login: { $arrayElemAt: ['$users.login', 0] },
        //                         userId: 1,
        //                         addedAt: 1,
        //                     },
        //                 },
        //                 { $sort: { addedAt: -1 } },
        //                 { $limit: 3 },
        //             ],
        //             as: 'newestLikes',
        //         },
        //     },
        //     { $sort: { [query.sortBy]: query.sortDirection as 1 | -1 } },
        //     { $skip: (query.pageNumber - 1) * query.pageSize },
        //     { $limit: query.pageSize },
        //     {
        //         $project: {
        //             _id: 0,
        //             id: { $toString: '$_id' },
        //             title: 1,
        //             shortDescription: 1,
        //             content: 1,
        //             blogId: 1,
        //             blogName: 1,
        //             createdAt: 1,
        //             'extendedLikesInfo.likesCount': '$likesCount',
        //             'extendedLikesInfo.dislikesCount': '$dislikesCount',
        //             'extendedLikesInfo.myStatus': {
        //                 $ifNull: ['$myStatus', LikeStatus.None],
        //             },
        //             'extendedLikesInfo.newestLikes': '$newestLikes',
        //         },
        //     },
        // ]);

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
        userId: string = '00000000-0000-0000-0000-000000000000',
    ) {
        // const countPosts = await this.postModel
        //     .find({ blogId: blogId, isDeleted: false })
        //     .countDocuments();

        if (!userId) {
            userId = '00000000-0000-0000-0000-000000000000'
        }
        let countPosts = 0
        try {
            countPosts = await this.dataSource.query(
                `
                SELECT COUNT(*)
                FROM public.posts
                WHERE "isDeleted" = False AND "blogId" = $1
            `,
                [blogId]
            );
            countPosts = Number(countPosts[0].count);
        } catch {
            console.log('postsQueryRepo.findPostsForBlog error of calculate count posts: ', e)
            return null
        }

        const allowedSortFields = [
            "id",
            "title",
            "shortDescription",
            "content",
            "createdAt",
            "likesCount",
            "dislikesCount"
        ];
        let sortBy = `"${query.sortBy}"`
        if (sortBy !== '"createdAt"') {
            sortBy = allowedSortFields.includes(query.sortBy) ? `"${query.sortBy}" COLLATE "C" ` : `"createdAt"`
        }

        let sortDirection = SortDirection.DESC;
        switch (query.sortDirection) {
            case 1:
                sortDirection = SortDirection.ASC;
                break
            case -1:
                sortDirection = SortDirection.DESC;
                break
        }

        //todo чтобы получить посты нужно
        // 1. сделать запрос для постов без трех новых лайков для блога
        let postsSourceWithoutNewestLikesByBlog: Array<Omit<PostsViewDto, "extendedLikesInfo"> & Omit<ExtendedLikesInfoViewDto, 'newestLikes'>> = []
        try {
            postsSourceWithoutNewestLikesByBlog = await this.dataSource.query(`
                SELECT 
                    p.id,
                    p.title,
                    p."shortDescription",
                    p.content,
                    p."blogId",
                    b."name" AS "blogName",
                    p."createdAt",
                    p."likesCount",
                    p."dislikesCount",
                    CASE 
                        WHEN l."likeStatus" IS NULL THEN $1
                        ElSE l."likeStatus"
                    END AS "myStatus"
                FROM posts p
                LEFT JOIN public.blogs b ON p."blogId" = b.id
                LEFT JOIN (
                    SELECT * 
                    FROM public.likes
                    WHERE likes."userId"= $2
                ) l ON l."parentId" = p.id
                WHERE p."blogId" = $3 AND p."isDeleted" = False
                ORDER BY ${sortBy} ${sortDirection}
                `,
                [
                    LikeStatus.None,
                    userId,
                    blogId
                ],
            );
        } catch {
            console.log('postsQueryRepo.findPostsForBlog error2:', e);
            return null
        }
        //todo 2. сделать запрос для постов с тремя лайками
        let postsSourceWithNewestLikes: Array<Omit<PostsViewDto, "extendedLikesInfo"> & LikeDetailsViewDto> & {
            addedAt: string;
            userId: string;
            login: string;
        } [] = []
        try {
            postsSourceWithNewestLikes = await this.dataSource.query(`
                SELECT 
                    p.id,
                    p.title,
                    p."shortDescription",
                    p.content,
                    p."blogId",
                    b."name" AS "blogName",
                    p."createdAt",
                    p."likesCount",
                    p."dislikesCount",
                    CASE 
                        WHEN l."likeStatus" IS NULL THEN $1
                        ElSE l."likeStatus"
                    END AS "myStatus",
                    nl."addedAt",
                    nl."userId",
                    nl.login,
                    nl."description"
                FROM posts p
                LEFT JOIN public.blogs b ON p."blogId" = b.id
                LEFT JOIN (
                    SELECT * 
                    FROM public.likes
                    WHERE likes."userId" = $2
                ) l ON l."parentId" = p."id"
                LEFT JOIN (
                    SELECT 
                        l."createdAt" AS "addedAt",
                        l."likeStatus" AS "description",
                        l."userId",
                        u.login, 
                        l."parentId"
                    FROM public.likes l
                    LEFT JOIN public.users u ON u.id = l."userId" 
                    WHERE l."likeStatus" = $3   
                    ORDER BY l."createdAt" DESC
                    LIMIT 3
                ) AS nl ON nl."parentId" = p.id
                WHERE p."blogId" = $4 AND p."isDeleted" = False
                `,
                [
                    LikeStatus.None,
                    userId,
                    LikeStatus.Like,
                    blogId
                ],
            );
        } catch (e) {
            console.log('postQueryRepo.findPostsForBlog error3:', e);
            return null
        }
        //todo 3. замапить эти два объекта в коде в тот вид, который нужен
        const posts: PostsViewDto[] = []
        postsSourceWithoutNewestLikesByBlog.map( postWithNoLikes => {
            const likes/*: LikeDetailsViewDto*/ = postsSourceWithNewestLikes.filter( (p) =>
                (
                    p.id === postWithNoLikes.id &&
                    p.description === LikeStatus.Like
                )
            ).map( p => {
                return {
                    description: p.description,
                    login: p.login,
                    userId: p.userId,
                    addedAt: p.addedAt
                }
            } )
            const fullPost: PostsViewDto = {
                id: postWithNoLikes.id,
                blogId: postWithNoLikes.blogId,
                blogName: postWithNoLikes.blogName,
                content: postWithNoLikes.content,
                createdAt: postWithNoLikes.createdAt,
                title: postWithNoLikes.title,
                shortDescription: postWithNoLikes.shortDescription,
                extendedLikesInfo: {
                    myStatus: postWithNoLikes.myStatus,
                    likesCount: postWithNoLikes.likesCount,
                    dislikesCount: postWithNoLikes.dislikesCount,
                    newestLikes: likes
                }
            }
            posts.push(fullPost)
        } )

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

        // let posts = [];
        // posts = await this.postModel
        //     .aggregate([
        //         {
        //             $addFields: {
        //                 _id: { $toString: '$_id' },
        //             },
        //         },
        //         {
        //             $match: {
        //                 blogId: blogId,
        //                 isDeleted: false,
        //             },
        //         },
        //         {
        //             $lookup: {
        //                 from: 'likes',
        //                 localField: '_id',
        //                 foreignField: 'parentId',
        //                 pipeline: [
        //                     { $match: { userId: userId } },
        //                     { $project: { _id: 0, likeStatus: 1 } },
        //                 ],
        //                 as: 'likes',
        //             },
        //         },
        //         {
        //             $addFields: {
        //                 myStatus: {
        //                     $arrayElemAt: ['$likes.likeStatus', 0],
        //                 },
        //             },
        //         },
        //         {
        //             $project: {
        //                 likes: 0,
        //             },
        //         },
        //         {
        //             $lookup: {
        //                 from: 'likes',
        //                 localField: '_id',
        //                 foreignField: 'parentId',
        //                 pipeline: [
        //                     {
        //                         $addFields: {
        //                             userId: { $toObjectId: '$userId' },
        //                         },
        //                     },
        //                     {
        //                         $match: { likeStatus: LikeStatus.Like },
        //                     },
        //                     {
        //                         $project: {
        //                             _id: 0,
        //                             addedAt: '$createdAt',
        //                             userId: 1,
        //                         },
        //                     },
        //                     {
        //                         $lookup: {
        //                             from: 'users',
        //                             localField: 'userId',
        //                             foreignField: '_id',
        //                             pipeline: [
        //                                 {
        //                                     $project: {
        //                                         _id: 0,
        //                                         login: 1,
        //                                     },
        //                                 },
        //                             ],
        //                             as: 'users',
        //                         },
        //                     },
        //                     {
        //                         $project: {
        //                             login: {
        //                                 $arrayElemAt: ['$users.login', 0],
        //                             },
        //                             userId: 1,
        //                             addedAt: 1,
        //                         },
        //                     },
        //                     { $sort: { addedAt: -1 } },
        //                     { $limit: 3 },
        //                 ],
        //                 as: 'newestLikes',
        //             },
        //         },
        //         { $sort: { [query.sortBy]: query.sortDirection as 1 | -1 } },
        //         { $skip: (query.pageNumber - 1) * query.pageSize },
        //         { $limit: query.pageSize },
        //         {
        //             $project: {
        //                 _id: 0,
        //                 id: { $toString: '$_id' },
        //                 title: 1,
        //                 shortDescription: 1,
        //                 content: 1,
        //                 blogId: 1,
        //                 blogName: 1,
        //                 createdAt: 1,
        //                 'extendedLikesInfo.likesCount': '$likesCount',
        //                 'extendedLikesInfo.dislikesCount': '$dislikesCount',
        //                 'extendedLikesInfo.myStatus': {
        //                     $ifNull: ['$myStatus', LikeStatus.None],
        //                 },
        //                 'extendedLikesInfo.newestLikes': '$newestLikes',
        //             },
        //         },
        //     ])
        //     .exec();

        const postsWithPaginate: Paginator<PostsViewDto> = {
            pagesCount: Math.ceil(countPosts / query.pageSize),
            page: query.pageNumber,
            pageSize: query.pageSize,
            totalCount: countPosts,
            items: posts,
        };

        return postsWithPaginate;
    }

    async findPost(postId: string, userId: string = '00000000-0000-0000-0000-000000000000'): Promise<PostsViewDto> {
        if (!userId) {
            userId = '00000000-0000-0000-0000-000000000000'
        }
        //todo чтобы получить посты нужно
        // 1. сделать запрос для постов без трех новых лайков для блога
        let postsSourceWithoutNewestLikesByBlog: Array<Omit<PostsViewDto, "extendedLikesInfo"> & Omit<ExtendedLikesInfoViewDto, 'newestLikes'>> = []
        try {
            postsSourceWithoutNewestLikesByBlog = await this.dataSource.query(`
                SELECT 
                    p.id,
                    p.title,
                    p."shortDescription",
                    p.content,
                    p."blogId",
                    b."name" AS "blogName",
                    p."createdAt",
                    p."likesCount",
                    p."dislikesCount",
                    CASE 
                        WHEN l."likeStatus" IS NULL THEN $1
                        ElSE l."likeStatus"
                    END AS "myStatus"
                FROM posts p
                LEFT JOIN public.blogs b ON p."blogId" = b.id
                LEFT JOIN (
                    SELECT * 
                    FROM public.likes
                    WHERE likes."userId" = $2
                ) l ON l."parentId" = p.id
                WHERE p."id" = $3
                `,
                [
                    LikeStatus.None,
                    userId,
                    postId
                ],
            );
        } catch (e) {
            console.log('postsQueryRepo.findPost error1:', e);
            return null
        }
        //todo 2. сделать запрос для постов с тремя лайками
        let postsSourceWithNewestLikes: Array<Omit<PostsViewDto, "extendedLikesInfo"> & LikeDetailsViewDto> & {
            addedAt: string;
            userId: string;
            login: string;
        } [] = []
        try {
            postsSourceWithNewestLikes = await this.dataSource.query(`
                SELECT 
                    p.id,
                    p.title,
                    p."shortDescription",
                    p.content,
                    p."blogId",
                    b."name" AS "blogName",
                    p."createdAt",
                    p."likesCount",
                    p."dislikesCount",
                    CASE 
                        WHEN l."likeStatus" IS NULL THEN $1
                        ElSE l."likeStatus"
                    END AS "myStatus",
                    nl."addedAt",
                    nl."userId",
                    nl.login,
                    nl."description"
                FROM posts p
                LEFT JOIN public.blogs b ON p."blogId" = b.id
                LEFT JOIN (
                    SELECT * 
                    FROM public.likes
                    WHERE likes."userId"= $2
                ) l ON l."parentId" = p."id"
                LEFT JOIN (
                    SELECT 
                        l."createdAt" AS "addedAt",
                        l."likeStatus" AS "description",
                        l."userId",
                        u.login, 
                        l."parentId"
                    FROM public.likes l
                    LEFT JOIN public.users u ON u.id = l."userId" 
                    WHERE l."likeStatus" = $3   
                    ORDER BY l."createdAt" DESC
                    LIMIT 3
                ) AS nl ON nl."parentId" = p.id
                WHERE p."id" = $4
                `,
                [
                    LikeStatus.None,
                    userId,
                    LikeStatus.Like,
                    postId
                ]
            );
        } catch {
            console.log('postQueryRepo.findPost error2:', e);
            return null
        }
        //todo 3. замапить эти два объекта в коде в тот вид, который нужен
        const posts: PostsViewDto[] = []
        postsSourceWithoutNewestLikesByBlog.map( postWithNoLikes => {
            const likes/*: LikeDetailsViewDto*/ = postsSourceWithNewestLikes.filter( (p) =>
                (
                    p.id === postWithNoLikes.id &&
                    p.description === LikeStatus.Like
                )
            ).map( p => {
                return {
                    description: p.description,
                    login: p.login,
                    userId: p.userId,
                    addedAt: p.addedAt
                }
            } )
            const fullPost: PostsViewDto = {
                id: postWithNoLikes.id,
                blogId: postWithNoLikes.blogId,
                blogName: postWithNoLikes.blogName,
                content: postWithNoLikes.content,
                createdAt: postWithNoLikes.createdAt,
                title: postWithNoLikes.title,
                shortDescription: postWithNoLikes.shortDescription,
                extendedLikesInfo: {
                    myStatus: postWithNoLikes.myStatus,
                    likesCount: postWithNoLikes.likesCount,
                    dislikesCount: postWithNoLikes.dislikesCount,
                    newestLikes: likes
                }
            }
            posts.push(fullPost)
        } )



        // const posts = await this.postModel
        //     .aggregate([
        //         {
        //             $addFields: {
        //                 _id: { $toString: '$_id' },
        //             },
        //         },
        //         {
        //             $match: {
        //                 _id: postId,
        //                 isDeleted: false,
        //             },
        //         },
        //         {
        //             $lookup: {
        //                 from: 'likes',
        //                 localField: '_id',
        //                 foreignField: 'parentId',
        //                 pipeline: [
        //                     { $match: { userId: userId } },
        //                     { $project: { _id: 0, likeStatus: 1 } },
        //                 ],
        //                 as: 'likes',
        //             },
        //         },
        //         {
        //             $addFields: {
        //                 myStatus: { $arrayElemAt: ['$likes.likeStatus', 0] },
        //             },
        //         },
        //         {
        //             $project: {
        //                 likes: 0,
        //             },
        //         },
        //         {
        //             $lookup: {
        //                 from: 'likes',
        //                 localField: '_id',
        //                 foreignField: 'parentId',
        //                 pipeline: [
        //                     {
        //                         $addFields: {
        //                             userId: { $toObjectId: '$userId' },
        //                         },
        //                     },
        //                     {
        //                         $match: { likeStatus: LikeStatus.Like },
        //                     },
        //                     {
        //                         $project: {
        //                             _id: 0,
        //                             addedAt: '$createdAt',
        //                             userId: 1,
        //                         },
        //                     },
        //                     {
        //                         $lookup: {
        //                             from: 'users',
        //                             localField: 'userId',
        //                             foreignField: '_id',
        //                             pipeline: [
        //                                 {
        //                                     $project: {
        //                                         _id: 0,
        //                                         login: 1,
        //                                     },
        //                                 },
        //                             ],
        //                             as: 'users',
        //                         },
        //                     },
        //                     {
        //                         $project: {
        //                             login: {
        //                                 $arrayElemAt: ['$users.login', 0],
        //                             },
        //                             userId: 1,
        //                             addedAt: 1,
        //                         },
        //                     },
        //                     { $sort: { addedAt: -1 } },
        //                     { $limit: 3 },
        //                 ],
        //                 as: 'newestLikes',
        //             },
        //         },
        //         {
        //             $project: {
        //                 _id: 0,
        //                 id: { $toString: '$_id' },
        //                 title: 1,
        //                 shortDescription: 1,
        //                 content: 1,
        //                 blogId: 1,
        //                 blogName: 1,
        //                 createdAt: 1,
        //                 'extendedLikesInfo.likesCount': '$likesCount',
        //                 'extendedLikesInfo.dislikesCount': '$dislikesCount',
        //                 'extendedLikesInfo.myStatus': {
        //                     $ifNull: ['$myStatus', LikeStatus.None],
        //                 },
        //                 'extendedLikesInfo.newestLikes': '$newestLikes',
        //             },
        //         },
        //     ])
        //     .exec();
        //
        // if (posts.length === 0) {
        //     return null;
        // }

        return posts[0];
    }
}
