import { Injectable } from '@nestjs/common';
import { User, UserModelType } from '../domain/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { UserViewDto } from '../api/dto/output/user-view.dto';
import { MeViewDto } from '../api/dto/output/me-view.dto';

@Injectable()
export class UsersQueryRepository {
    constructor(
        @InjectModel(User.name) private userModel: UserModelType,
    ) {
    }

    async findUserById(userId: string): Promise<UserViewDto> {

        return this.userModel.findById(userId, {
            _id: 0,
            id: { $toString: '$_id' },
            email: 1,
            login: 1,
            createdAt: 1,
        });
    }

    async findMe(userId: string): Promise<MeViewDto> {

        return this.userModel.findById(userId, {
            _id: 0,
            email: 1,
            login: 1,
            userId: { $toString: '$_id' }
        }).lean();
    }

}