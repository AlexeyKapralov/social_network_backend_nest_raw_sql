import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

@Schema()
export class Blog {
    // @Prop()
    // _id: mongoose.ObjectId
    @Prop()
    name: string
    @Prop()
    description: string
    @Prop()
    websiteUrl: string
    @Prop()
    createdAt: string
    @Prop()
    isMembership: boolean
    @Prop()
    isDeleted: boolean
}


export const BlogSchema = SchemaFactory.createForClass(Blog)

export type BlogDocument = HydratedDocument<Blog>;
export type BlogModelType = Model<BlogDocument>

export type BlogDocumentSql = {
    id: string
    name: string
    description: string
    websiteUrl: string
    createdAt: string
    isMembership: boolean
    isDeleted: boolean
}