import { Injectable } from '@nestjs/common';
import { BlogDocumentSql } from '../domain/blogs.entity';
import { BlogInputDto } from '../api/dto/input/blog-input.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class BlogsRepository {
    constructor(
        @InjectDataSource() private dataSource: DataSource,
    ) {
    }

    async createBlog(blogBody: BlogInputDto): Promise<BlogDocumentSql> {
        try {
            const blog = await this.dataSource.query(`
            INSERT INTO public.blogs(
                name, description, "websiteUrl"
                ) 
            VALUES(
                $1, $2, $3      
            )
            RETURNING id, name, description, "websiteUrl", "createdAt", "isMembership", "isDeleted"
        `, [blogBody.name, blogBody.description, blogBody.websiteUrl],
            );
            return blog[0];
        } catch (e) {
            console.log('blogRepo.createBlog error: ', e);
            return null;
        }

    }

    async updateBlog(blogId: string, updateData: BlogInputDto): Promise<boolean> {
        try {
            const blogs = await this.dataSource.query(`
                UPDATE public.blogs
                SET name=$1, description=$2, "websiteUrl"=$3
                WHERE id = $4 AND "isDeleted" = False
            `, [updateData.name, updateData.description, updateData.websiteUrl, blogId],
            );
            //ответ будет в форме [ [data], [updated count ] ]
            return blogs[1] > 0;
        } catch (e) {
            console.log('blogRepo.updateBlog error: ', e);
            return null;
        }
    }

    async deleteBlog(blogId: string): Promise<boolean> {
        try {
            const blogs = await this.dataSource.query(`
                UPDATE public.blogs
                SET "isDeleted"=True
                WHERE id = $1 AND "isDeleted" = False
            `, [blogId],
            );
            //ответ будет в форме [ [data], [updated count ] ]
            return blogs[1] > 0;
        } catch (e) {
            console.log('blogRepo.deleteBlog error: ', e);
            return null;
        }
    }

    async findBlog(blogId: string): Promise<BlogDocumentSql> {
        try {
            const blog = await this.dataSource.query(
                `
                SELECT 
                    id,
                    name,
                    description,
                    "websiteUrl",
                    "createdAt",
                    "isMembership",
                    "isDeleted"
                FROM
                    public.blogs
                WHERE id = $1 AND "isDeleted" = False
            `,
                [blogId],
            );
            return blog[0];
        } catch (e) {
            console.log('blogRepo.findBlog error: ', e);
            return null;
        }
    }
}