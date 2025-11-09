import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SurveysController } from './surveys.controller';
import { SurveysService } from './surveys.service';
import { Survey, SurveySchema } from '../schemas/survey.schema';
import { Response, ResponseSchema } from '../schemas/response.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Survey.name, schema: SurveySchema },
      { name: Response.name, schema: ResponseSchema },
    ]),
  ],
  controllers: [SurveysController],
  providers: [SurveysService],
})
export class SurveysModule {}

