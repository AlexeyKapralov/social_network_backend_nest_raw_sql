import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentDocument, CommentModelType } from '../../domain/comment.entity';
import { Like, LikeModelType } from '../../../likes/domain/likes.entity';
import { LikeStatus } from '../../../likes/api/dto/output/likes-view.dto';
import { CommentsViewDto } from '../../api/dto/output/commentsView.dto';
import { PostsQueryRepository } from '../../../posts/infrastructure/posts-query.repository';
import { InterlayerNotice, InterLayerStatuses } from '../../../../../base/models/interlayer';
import { User, UserModelType } from '../../../../users/domain/user.entity';
import { Paginator } from '../../../../../common/dto/paginator.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SortDirection } from '../../../../../common/dto/query.dto';

export class GetCommentsPayload implements IQuery {
    constructor(
        public sortBy: string,
        public sortDirection: number,
        public pageNumber: number,
        public pageSize: number,
        public postId: string,
        public userId: string | null,
    ) {
    }
}

@QueryHandler(GetCommentsPayload)
export class GetCommentsQuery implements IQueryHandler<
    GetCommentsPayload,
    InterlayerNotice<GetCommentsResultType>
> {
    constructor(
        @InjectDataSource() private dataSource: DataSource,
        private readonly postQueryRepository: PostsQueryRepository
    ) {
    }

    async execute(query: GetCommentsPayload): Promise<InterlayerNotice<GetCommentsResultType>> {
        const notice = new InterlayerNotice<GetCommentsResultType>;

        if (!query.userId) {
            query.userId = '00000000-0000-0000-0000-000000000000'
        }

        const post = await this.postQueryRepository.findPost(query.postId);
        if (!post) {
            notice.addError('post not found', 'postId', InterLayerStatuses.NOT_FOUND);
            return notice;
        }
        const likeStatus = LikeStatus.None
        if ( query.userId === null ) {
            query.userId = ''
        }

        let countComments = 0
        try {
            countComments = await this.dataSource.query(`
            SELECT COUNT(*) AS count
            FROM public.comments
            WHERE "postId" = $1
        `,
                [query.postId],
            );
            countComments = Number(countComments[0].count);
        } catch (e) {
            console.log('get comments query countComments error: ', e);
            notice.addError('countComments error', 'countComments', InterLayerStatuses.NOT_FOUND);
            return notice;
        }

        const allowedSortFields = [
            "content",
            "createdAt",
            "likesCount",
            "dislikesCount"
        ];
        let sortBy = `"${query.sortBy}"`
        if (sortBy !== '"createdAt"') {
            sortBy = allowedSortFields.includes(query.sortBy) ? `"${query.sortBy}" COLLATE "C" ` : `"createdAt"`
        }
        // if ( query.sortBy === "blogName" ) {
        //     sortBy = `b."name" COLLATE "C" `
        // }

        let sortDirection = SortDirection.DESC;
        switch (query.sortDirection) {
            case 1:
                sortDirection = SortDirection.ASC;
                break
            case -1:
                sortDirection = SortDirection.DESC;
                break
        }

        let comments
        try {
            comments = await this.dataSource.query(`
            SELECT 
                c.id,
                c.content,
                c."userId",
                u."login" AS "userLogin",
                c."createdAt",
                c."likesCount",
                c."dislikesCount",
                CASE 
                    WHEN l."likeStatus" IS NULL THEN $3
                    ElSE l."likeStatus"
                END AS "myStatus"                 
            FROM public.comments c
            LEFT JOIN ( 
                SELECT l."likeStatus", l."parentId"
                FROM public.likes l
                WHERE l."userId" = $2 
            ) AS l ON l."parentId" = c."id"
            LEFT JOIN public.users u ON u.id = c."userId"
            WHERE "postId" = $1
            ORDER BY ${sortBy} ${sortDirection}
            LIMIT $4 OFFSET $5
        `,
                [
                    query.postId,
                    query.userId,
                    LikeStatus.None,
                    query.pageSize,
                    (query.pageNumber - 1) * query.pageSize
                ],
            );
        } catch (e) {
            console.log('get comments query error: ', e);
            notice.addError('countComments error', 'countComments', InterLayerStatuses.NOT_FOUND);
            return notice;
        }

        const commentsMapped: CommentsViewDto[] = []
        comments.map( (comment) => {
            commentsMapped.push({
                id: comment.id,
                content: comment.content,
                createdAt: comment.createdAt,
                commentatorInfo: {
                    userId: comment.userId,
                    userLogin: comment.userLogin
                },
                likesInfo: {
                    likesCount: comment.likesCount,
                    dislikesCount: comment.dislikesCount,
                    myStatus: comment.myStatus
                }
            })
        } )

        const commentsMappedWithPagination: Paginator<CommentsViewDto> = {
            pagesCount: Math.ceil(countComments / query.pageSize),
            page: query.pageNumber,
            pageSize: query.pageSize,
            totalCount: countComments,
            items: commentsMapped,
        };

        notice.addData(commentsMappedWithPagination);

        return notice;
    }
}

export type GetCommentsResultType = Paginator<CommentsViewDto>
