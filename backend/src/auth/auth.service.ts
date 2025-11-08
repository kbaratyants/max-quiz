import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async mockAuth(maxId: string, role: 'teacher' | 'student') {
    let user = await this.userModel.findOne({ maxId }).exec();
    
    if (!user) {
      user = new this.userModel({ maxId, role });
      await user.save();
    } else {
      user.role = role;
      await user.save();
    }

    return {
      user: {
        _id: user._id,
        maxId: user.maxId,
        role: user.role,
      },
    };
  }

  async findUserById(id: string) {
    return this.userModel.findById(id).exec();
  }
}

