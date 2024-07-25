import { ArgumentMetadata, Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { BlogsRepository } from '../../features/blogs/blogs/infrastructure/blogs.repository';

@Injectable()
/*
* проверка существования юзера по userId
* */
export class IsBlogExistPipe implements PipeTransform<string, Promise<string>> {
    constructor(private readonly blogsRepository: BlogsRepository) {}

    async transform(value: string, metadata: ArgumentMetadata): Promise<string> {
        let blog = null
        try {
            blog = await this.blogsRepository.findBlog(value)
        } catch {
            throw new NotFoundException('Blog did not find');
        }
        return value
    }


}