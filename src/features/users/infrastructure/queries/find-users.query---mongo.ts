import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InterlayerNotice } from '../../../../base/models/interlayer';
import { Paginator } from '../../../../common/dto/paginator.dto';
import { UserViewDto } from '../../api/dto/output/user-view.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../../domain/user.entity';

export class FindUsersQueryPayload implements IQuery {
    constructor(
        public sortBy: string,
        public sortDirection: number | string,
        public pageNumber: number,
        public pageSize: number,
        public searchLoginTerm: string | null,
        public searchEmailTerm: string | null,
) {}
}

@QueryHandler(FindUsersQueryPayload)
export class FindUsersQuery implements
    IQueryHandler<
        FindUsersQueryPayload,
        InterlayerNotice<FindUsersQueryResultType>
    >
{
    constructor(
        @InjectModel(User.name) private userModel: UserModelType,
    ) {}
    async execute(queryPayload: FindUsersQueryPayload) {
        const countUsers = await this.userModel.find(
            {
                $and: [
                    { isDeleted: false },
                    {
                        $or: [

                            { email: { $regex: queryPayload.searchEmailTerm || '', $options: 'i' } },
                            { login: { $regex: queryPayload.searchLoginTerm || '', $options: 'i' } },
                        ],
                    },
                ],
            },
        ).countDocuments();
        const users: UserViewDto[] = await this.userModel.aggregate([
            {
                $match: {
                    $and: [
                        { isDeleted: false },
                        {
                            $or: [

                                { email: { $regex: queryPayload.searchEmailTerm || '', $options: 'i' } },
                                { login: { $regex: queryPayload.searchLoginTerm || '', $options: 'i' } },
                            ],
                        },
                    ],
                },
            },
            { $sort: { [queryPayload.sortBy]: queryPayload.sortDirection as 1 | -1 } },
            { $skip: (queryPayload.pageNumber - 1) * queryPayload.pageSize },
            {
                $project: {
                    _id: 0,
                    id: { $toString: '$_id' },
                    email: 1,
                    login: 1,
                    createdAt: 1,
                },
            },
            { $limit: queryPayload.pageSize },
        ]).exec();

        const usersWithPaginate: Paginator<UserViewDto> = {
            pagesCount: Math.ceil(countUsers / queryPayload.pageSize),
            page: queryPayload.pageNumber,
            pageSize: queryPayload.pageSize,
            totalCount: countUsers,
            items: users,
        };

        const notice = new InterlayerNotice<FindUsersQueryResultType>

        notice.addData(usersWithPaginate)

        return notice;
    }

}

export type FindUsersQueryResultType = Paginator<UserViewDto>