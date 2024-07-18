import { IsMongoId, Length } from 'class-validator';
import { Trim } from '../../../../../../common/decorators/transform/trim.decorator';
import { IsExistBlog } from '../../../../../../common/decorators/validate/isExistBlog.decorator';

export class PostInputDto {
    @Trim()
    @Length(1, 30)
    title: string
    @Trim()
    @Length(1, 100)
    shortDescription: string
    @Trim()
    @Length(1, 1000)
    content: string
    @IsExistBlog()
    @IsMongoId()
    @Trim()
    @Length(1)
    blogId: string
}