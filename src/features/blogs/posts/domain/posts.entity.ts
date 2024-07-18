import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

@Schema()
export class Post {

    @Prop()
    title: string

    @Prop()
    shortDescription: string

    @Prop()
    content: string

    @Prop()
    blogId: string

    @Prop()
    blogName: string

    @Prop()
    createdAt: string

    @Prop()
    likesCount: number

    @Prop()
    dislikesCount: number

    @Prop()
    isDeleted: boolean

    addCountLikes(count: number) {
        this.likesCount += count
    }

    addCountDislikes(count: number) {
        this.dislikesCount += count
    }

    static createPost(
        title: string,
        shortDescription: string,
        content: string,
        blogId: string,
        blogName: string
    ) {
        const p = new this()
        p.title = title
        p.shortDescription = shortDescription
        p.content = content
        p.blogId = blogId
        p.blogName = blogName
        p.createdAt = new Date().toISOString()
        p.likesCount = 0
        p.dislikesCount = 0
        p.isDeleted = false

        return p
    }

}

export type PostsStaticType = {
    createPost: (
        title: string,
        shortDescription: string,
        content: string,
        blogId: string,
        blogName: string
    ) => PostDocument
}

export const PostSchema = SchemaFactory.createForClass(Post)

PostSchema.methods = {
    addCountLikes: Post.prototype.addCountLikes,
    addCountDislikes: Post.prototype.addCountDislikes
}
PostSchema.statics = {
    createPost: Post.createPost
}

export type PostDocument = HydratedDocument<Post>
export type PostModelType = Model<PostDocument> & PostsStaticType

