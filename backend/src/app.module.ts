import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SurveysModule } from './surveys/surveys.module';
import { ResponsesModule } from './responses/responses.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/maxquiz'),
    SurveysModule,
    ResponsesModule,
  ],
})
export class AppModule {}

