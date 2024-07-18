import {
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    Headers,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    Put,
    Res,
    UseGuards,
} from '@nestjs/common';
import { CommentsService } from '../application/comments.service';
import { Response } from 'express';
import { CommentInputDto } from './dto/input/comment-input.dto';
import { LikeInputDto } from '../../likes/api/dto/input/like-input.dto';
import { CommandBus } from '@nestjs/cqrs';
import { LikeCommentCommand } from '../application/usecases/like-comment.usecase';
import { JwtLocalService } from '../../../../base/services/jwt-local.service';
import { JwtAuthGuard } from '../../../auth/auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../../../auth/auth/api/decorators/current-user.param.decorator';
import { InterlayerNotice, InterLayerStatuses } from '../../../../base/models/interlayer';

@Controller('comments')
export class CommentsController {
    constructor(
        private readonly commentService: CommentsService,
        private readonly commandBus: CommandBus,
        private readonly jwtLocalService: JwtLocalService,
    ) {}

    @Get(':commentId')
    async getComment(
        @Param('commentId') commentId: string,
        @Res({ passthrough: true }) res: Response,
        @Headers('authorization') authorization: string,
    ) {
        const userId = await this.jwtLocalService.parseJwtToken(authorization);

        const comment = await this.commentService.getComment(commentId, userId);
        comment.data
            ? res.status(HttpStatus.OK).send(comment.data)
            : res.status(HttpStatus.NOT_FOUND);
    }

    @UseGuards(JwtAuthGuard)
    @Put(':commentId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateComment(
        @Param('commentId') commentId: string,
        @Body() commentInputDto: CommentInputDto,
        @CurrentUserId() userId: string,
    ) {
        const commentInterLayer = await this.commentService.updateComment(
            userId,
            commentId,
            commentInputDto,
        );

        if (commentInterLayer.code === InterLayerStatuses.FORBIDDEN) {
            throw new ForbiddenException();
        }

        if (commentInterLayer.code === InterLayerStatuses.NOT_FOUND) {
            throw new NotFoundException();
        }
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':commentId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteComment(
        @Param('commentId') commentId: string,
        @CurrentUserId() userId: string,
    ) {
        const interLayerComment = await this.commentService.deleteComment(
            userId,
            commentId,
        );

        if (interLayerComment.code === InterLayerStatuses.NOT_FOUND) {
            throw new NotFoundException();
        }
        if (interLayerComment.code === InterLayerStatuses.FORBIDDEN) {
            throw new ForbiddenException();
        }
    }

    @UseGuards(JwtAuthGuard)
    @Put(':commentId/like-status')
    @HttpCode(HttpStatus.NO_CONTENT)
    async likeComment(
        @Param('commentId') commentId: string,
        @Body() likeBody: LikeInputDto,
        @CurrentUserId() userId: string,
    ) {
        const command = new LikeCommentCommand(
            commentId,
            userId,
            likeBody.likeStatus,
        );
        const likeCommentResult = await this.commandBus.execute<
            LikeCommentCommand,
            InterlayerNotice
        >(command);

        if (likeCommentResult.code === InterLayerStatuses.NOT_FOUND) {
            throw new NotFoundException();
        }
    }
}
