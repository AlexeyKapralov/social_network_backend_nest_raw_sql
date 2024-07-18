import { Injectable } from '@nestjs/common';
import { Blog, BlogModelType } from '../domain/blogs.entity';
import { BlogViewModel } from '../api/dto/output/blogView.model';
import { InjectModel } from '@nestjs/mongoose';
import { Paginator } from '../../../../common/dto/paginator.dto';
import { QueryDtoWithName } from '../../../../common/dto/query.dto';

@Injectable()
export class BlogsQueryRepository {
    constructor(
        @InjectModel(Blog.name) private readonly blogModel: BlogModelType,
    ) {
    }


    async findBlog(blogId: string): Promise<BlogViewModel> {

        return this.blogModel.findOne({
            $and: [
                { _id: blogId },
                { isDeleted: false },
            ],
        }, {
            _id: 0,
            id: { $toString: '$_id' },
            name: 1,
            description: 1,
            websiteUrl: 1,
            createdAt: 1,
            isMembership: 1,
        }).lean()

    }

    async findBlogs(query: QueryDtoWithName): Promise<Paginator<BlogViewModel>> {


        const countBlogs = await this.blogModel.countDocuments(
            {$and: [
                    { isDeleted: false },
                    { name: { $regex: query.searchNameTerm || '', $options: 'i' }},
                ]
            }
        );

        const blogs: BlogViewModel[] = await this.blogModel.aggregate([
            {
                $match: {
                    $and: [
                        { name: { $regex: query.searchNameTerm || '', $options: 'i' } },
                        { isDeleted: false },
                    ],
                },
            },
            { $sort: { [query.sortBy]: query.sortDirection as 1 | -1 } },
            { $skip: (query.pageNumber - 1) * query.pageSize },
            {
                $project: {
                    _id: 0,
                    id: { $toString: '$_id' },
                    name: 1,
                    description: 1,
                    websiteUrl: 1,
                    createdAt: 1,
                    isMembership: 1
                },
            },
            { $limit: query.pageSize },
        ]).exec()

        const paginatedBlogs: Paginator<BlogViewModel> = {
            pagesCount: Math.ceil( countBlogs / query.pageSize ),
            page: query.pageNumber,
            pageSize: query.pageSize,
            totalCount: countBlogs,
            items: blogs
        }
        return paginatedBlogs
    }
}