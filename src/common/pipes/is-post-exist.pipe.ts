import {
    ArgumentMetadata,
    Injectable,
    NotFoundException,
    PipeTransform,
} from '@nestjs/common';
import { UsersRepository } from '../../features/users/infrastructure/users.repository';
import { PostsRepository } from '../../features/blogs/posts/infrastructure/posts.repository';

@Injectable()
/*
* проверка существования юзера по userId
* */
export class IsPostExistPipe implements PipeTransform<string, Promise<string>> {
    constructor(private readonly postsRepository: PostsRepository) {}

    async transform(value: string, metadata: ArgumentMetadata): Promise<string> {
        let post = null
        try {
            post = await this.postsRepository.findPost(value)
        } catch {
            throw new NotFoundException('Post did not find');
        }
        return value
    }


}