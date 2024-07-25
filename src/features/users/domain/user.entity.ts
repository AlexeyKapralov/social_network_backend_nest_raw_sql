import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Model } from 'mongoose';
import { UserInputDto } from '../api/dto/input/user-input.dto';

@Schema()
export class User {
    @Prop()
    login: string;

    @Prop()
    email: string;

    @Prop()
    password: string;

    @Prop()
    createdAt: string;

    @Prop()
    isDeleted: boolean;

    @Prop()
    confirmationCode: string;

    @Prop()
    isConfirmed: boolean;

    setLogin(newLogin: string) {
        this.login = newLogin;
    }

    static createUser(userBody: UserInputDto, passHash: string, confirmationCode: string) {
        const user = new this();

        user.email = userBody.email;
        user.createdAt = new Date().toISOString();
        user.password = passHash;
        user.login = userBody.login;
        user.isDeleted = false;
        user.isConfirmed = false;
        user.confirmationCode = confirmationCode;

        return user;
    }
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.methods = {
    setLogin: User.prototype.setLogin,
};

UserSchema.statics = {
    createUser: User.createUser,
};

export type UserStaticType = {
    createUser: (userBody: UserInputDto, passHash: string, confirmationCode: string) => UserDocument;
};

export type UserDocument = HydratedDocument<User>;
export type UserModelType = Model<UserDocument> & UserStaticType;


export type UserDocumentSql = {
    id: string,
    password: string,
    email: string,
    login: string,
    createdAt: string,
    confirmationCode: string
}
