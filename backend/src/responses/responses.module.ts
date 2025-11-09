import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponsesController } from './responses.controller';
import { ResponsesService } from './responses.service';
import { Response, ResponseSchema } from '../schemas/response.schema';
import { Survey, SurveySchema } from '../schemas/survey.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Response.name, schema: ResponseSchema },
      { name: Survey.name, schema: SurveySchema },
    ]),
  ],
  controllers: [ResponsesController],
  providers: [ResponsesService],
})
export class ResponsesModule {}

