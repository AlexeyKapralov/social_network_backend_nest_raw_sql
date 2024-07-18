import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { PostsQueryRepository } from '../../../posts/infrastructure/posts-query.repository';
import { LikeRepository } from '../../../likes/repository/like.repository';
import { InterlayerNotice, InterLayerStatuses } from '../../../../../base/models/interlayer';

export class CreateCommentCommand {
    constructor(
        public postId: string,
        public content: string,
        public userId: string
    ) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase implements ICommandHandler<
    CreateCommentCommand,
    InterlayerNotice<CreateCommentResultType>
> {
    constructor(
        private readonly commentsRepository: CommentsRepository,
        private readonly postQueryRepository: PostsQueryRepository,
        private readonly likeRepository: LikeRepository,
    ) {}

    async execute(command: CreateCommentCommand): Promise<InterlayerNotice<CreateCommentResultType>> {
        const notice = new InterlayerNotice<CreateCommentResultType>
        const post = await this.postQueryRepository.findPost(command.postId)

        if (!post) {
            notice.addError('post not found', 'postId', InterLayerStatuses.NOT_FOUND)
            return notice
        }

        const comment  = await this.commentsRepository.createComment(
            command.postId, command.content, command.userId
        )
        if (!comment) {
            notice.addError(`comment didn't create`)
            return notice
        }

        notice.addData({ commentId: comment._id.toString() })
        return notice
    }
}

export type CreateCommentResultType = {
    commentId: string
}