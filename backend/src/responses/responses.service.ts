import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Response, ResponseDocument } from '../schemas/response.schema';
import { Survey, SurveyDocument } from '../schemas/survey.schema';

@Injectable()
export class ResponsesService {
  constructor(
    @InjectModel(Response.name) private responseModel: Model<ResponseDocument>,
    @InjectModel(Survey.name) private surveyModel: Model<SurveyDocument>,
  ) {}

  async getMyResponses(clientId: string) {
    const responses = await this.responseModel
      .find({ clientId })
      .sort({ createdAt: -1 })
      .exec();

    const surveyIds = responses.map((r) => r.surveyId);
    const surveys = await this.surveyModel
      .find({ _id: { $in: surveyIds } })
      .exec();

    const surveyMap = new Map(surveys.map((s) => [s._id.toString(), s]));

    return responses.map((response) => {
      const survey = surveyMap.get(response.surveyId.toString());
      return {
        _id: response._id,
        surveyId: response.surveyId,
        surveyTitle: survey?.title || 'Опрос удален',
        createdAt: response.createdAt,
      };
    });
  }
}

