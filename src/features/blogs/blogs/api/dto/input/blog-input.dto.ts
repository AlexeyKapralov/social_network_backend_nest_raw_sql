import { Length, Matches } from 'class-validator';
import { Trim } from '../../../../../../common/decorators/transform/trim.decorator';

export class BlogInputDto {
    @Trim()
    @Length(1,15)
    name: string
    @Trim()
    @Length(1,500)
    description: string
    @Trim()
    @Length(1,100)
    @Matches('^https://([a-zA-Z0-9_-]+\\.)+[a-zA-Z0-9_-]+(\\/[a-zA-Z0-9_-]+)*\\/?$')
    websiteUrl: string
}