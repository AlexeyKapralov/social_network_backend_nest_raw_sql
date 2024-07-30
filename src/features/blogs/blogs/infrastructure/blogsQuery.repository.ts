import { Injectable } from '@nestjs/common';
import { BlogViewDto } from '../api/dto/output/blogViewDto';
import { Paginator } from '../../../../common/dto/paginator.dto';
import { QueryDtoWithName, SortDirection } from '../../../../common/dto/query.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class BlogsQueryRepository {
    constructor(
        @InjectDataSource() private dataSource: DataSource,
    ) {
    }


    async findBlog(blogId: string): Promise<BlogViewDto> {

        try {
            const blog = await this.dataSource.query(
                `
                SELECT 
                    id, 
                    name, 
                    description,
                    "websiteUrl",
                    "createdAt",
                    "isMembership"
                FROM
                    public.blogs
                WHERE
                    id = $1 AND 
                    "isDeleted" = False
            `,
                [blogId],
            );
            return blog[0];
        } catch (e) {
            console.log('blogQueryRepo.findBlog error: ', e);
            return null;
        }

    }

    async findBlogs(query: QueryDtoWithName): Promise<Paginator<BlogViewDto>> {
        let countBlogs = 0;
        try {
            countBlogs = await this.dataSource.query(
                `
                SELECT COUNT(*)
                FROM public.blogs
                WHERE LOWER(name) LIKE LOWER($1) AND "isDeleted" = False
            `,
                [`%${query.searchNameTerm ? query.searchNameTerm : ''}%`],
            );
            countBlogs = Number(countBlogs[0].count);
        } catch (e) {
            console.log('blogsQueryRepo.findBlogs error: ', e);
            return null;
        }

        const allowedSortFields = [
            'id',
            'name',
            'description',
            'websiteUrl',
            'createdAt',
        ];
        let sortBy = `"${query.sortBy}"`;
        if (sortBy !== '"createdAt"') {
            sortBy = allowedSortFields.includes(query.sortBy) ? `"${query.sortBy}" COLLATE "C" ` : `"createdAt"`;
        }

        let sortDirection = SortDirection.DESC;
        switch (query.sortDirection) {
            case 1:
                sortDirection = SortDirection.ASC;
                break;
            case -1:
                sortDirection = SortDirection.DESC;
                break;
        }
        let blogs: BlogViewDto[] = [];
        try {
            blogs = await this.dataSource.query(
                `
                SELECT 
                    id,
                    name,
                    description,
                    "websiteUrl",
                    "createdAt",
                    "isMembership"
                FROM public.blogs
                WHERE LOWER(name) LIKE LOWER($1) AND "isDeleted" = False
                ORDER BY ${sortBy} ${sortDirection}
                LIMIT $2 OFFSET $3
            `,
                [
                    `%${query.searchNameTerm ? query.searchNameTerm : ''}%`,
                    query.pageSize,
                    (query.pageNumber - 1) * query.pageSize,
                ],
            );
        } catch (e) {
            console.log('blogQueryRepo.findBlogs2 error:', e);
            return null;
        }

        return {
            pagesCount: Math.ceil(countBlogs / query.pageSize),
            page: query.pageNumber,
            pageSize: query.pageSize,
            totalCount: countBlogs,
            items: blogs,
        };
    }
}