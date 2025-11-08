import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { SurveysModule } from './surveys/surveys.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/maxquiz'),
    AuthModule,
    SurveysModule,
  ],
})
export class AppModule {}

