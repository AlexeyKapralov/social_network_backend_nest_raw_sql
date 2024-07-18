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
        @InjectModel(Comment.name) private readonly commentModel: CommentModelType,
        @InjectModel(User.name) private readonly userModel: UserModelType,
        @InjectModel(Like.name) private readonly likeModel: LikeModelType,
        private readonly postQueryRepository: PostsQueryRepository,
    ) {
    }

    async execute(query: GetCommentsPayload): Promise<InterlayerNotice<GetCommentsResultType>> {
        const notice = new InterlayerNotice<GetCommentsResultType>;

        const post = await this.postQueryRepository.findPost(query.postId);
        if (!post) {
            notice.addError('post not found', 'postId', InterLayerStatuses.NOT_FOUND);
            return notice;
        }
        const likeStatus = LikeStatus.None
        if ( query.userId === null ) {
            query.userId = ''
        }

        const countComments = await this.commentModel.countDocuments({
                postId: query.postId,
                isDeleted: false,
            },
        );

        // const comments: CommentDocument[] = await this.commentModel.aggregate([
        //     {
        //         $match: {
        //             postId: query.postId,
        //             isDeleted: false,
        //
        //         },
        //     },
        //     { $sort: { [query.sortBy]: query.sortDirection as 1 | -1 } },
        //     { $skip: (query.pageNumber - 1) * query.pageSize },
        // ]).exec();

        const comments = await this.commentModel.aggregate([
                {
                    $addFields: {
                        _commentIdString: { $toString: '$_id' },
                        userId: { $toObjectId: '$userId' },
                    },
                },
                {
                    $match: {
                        postId: query.postId,
                        isDeleted: false,
                    },
                },
                {
                    $lookup: {
                        from: 'likes',
                        localField: '_commentIdString',
                        foreignField: 'parentId',
                        pipeline: [
                            { $match: { userId: query.userId } },
                            { $project: { _id: 0, likeStatus: 1 } },
                        ],
                        as: 'likes',
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        pipeline: [
                            // { $match: { isDeleted: false } },
                            { $project: { _id: 0, login: 1 } },
                        ],
                        as: 'users',
                    },
                },
                { $sort: { [query.sortBy]: query.sortDirection as 1 | -1 } },
                { $skip: (query.pageNumber - 1) * query.pageSize },
                {
                    $project: {
                        _id: 0,
                        id: { $toString: '$_id' },
                        content: 1,
                        'commentatorInfo.userId': '$userId',
                        'commentatorInfo.userLogin': { $arrayElemAt: ['$users.login', 0] },
                        createdAt: 1,
                        'likesInfo.likesCount': '$likesCount',
                        'likesInfo.dislikesCount': '$dislikesCount',
                        'likesInfo.myStatus':  { $ifNull: [ { $arrayElemAt: ['$likes.likeStatus', 0] }, LikeStatus.None ] },
                    }
                },
            ],
        ).exec();

        /*let commentsMapped: CommentsViewDto[] = [];
        promise all чтобы дождаться выполнения всех промисов
        await Promise.all(comments.map(async (
            comment:
                CommentDocument &
                { likes: { likesStatus: LikeStatus }[] } &
                { users: { login: string }[] }
        ) => {

            let userFromComment: UserDocument;
            userFromComment = await this.userModel.findOne({ _id: comment.userId }).exec();

            let likeStatus: LikeStatus = LikeStatus.None;
            if (comment.likes.length !== 0) {
                likeStatus = comment.likes[0].likesStatus;
            }

            commentsMapped.push({
                id: comment._id.toString(),
                content: comment.content,
                commentatorInfo: {
                    userId: comment.userId,
                    userLogin: comment.users[0].login,
                },
                createdAt: comment.createdAt,
                likesInfo: {
                    likesCount: comment.likesCount,
                    dislikesCount: comment.dislikesCount,
                    myStatus: likeStatus
                },
            });
        })); */

        const commentsMappedWithPagination: Paginator<CommentsViewDto> = {
            pagesCount: Math.ceil(countComments / query.pageSize),
            page: query.pageNumber,
            pageSize: query.pageSize,
            totalCount: countComments,
            items: comments,
        };

        notice.addData(commentsMappedWithPagination);

        return notice;
    }
}

export type GetCommentsResultType = Paginator<CommentsViewDto>
