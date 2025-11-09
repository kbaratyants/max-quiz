import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Survey, SurveyDocument } from '../schemas/survey.schema';
import { Response, ResponseDocument } from '../schemas/response.schema';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SurveysService {
  constructor(
    @InjectModel(Survey.name) private surveyModel: Model<SurveyDocument>,
    @InjectModel(Response.name) private responseModel: Model<ResponseDocument>,
  ) {}

  async createSurvey(dto: CreateSurveyDto, ownerId: string) {
    const survey = new this.surveyModel({
      title: dto.title,
      questions: dto.questions,
      ownerId: ownerId || 'teacher-1',
    });
    return survey.save();
  }

  async getMySurveys(ownerId: string) {
    return this.surveyModel.find({ ownerId }).sort({ createdAt: -1 }).exec();
  }

  async getSurveyById(id: string) {
    const survey = await this.surveyModel.findById(id).exec();
    if (!survey) {
      throw new NotFoundException('Опрос не найден');
    }
    return survey;
  }

  async createResponse(surveyId: string, answers: number[], clientId?: string) {
    const survey = await this.getSurveyById(surveyId);
    
    const finalClientId = clientId || uuidv4();
    
    const response = new this.responseModel({
      surveyId,
      answers,
      clientId: finalClientId,
    });
    
    const savedResponse = await response.save();
    
    return {
      ...savedResponse.toObject(),
      clientId: finalClientId,
    };
  }


  async getSurveyStats(id: string, ownerId: string) {
    const survey = await this.getSurveyById(id);
    
    if (survey.ownerId !== ownerId) {
      throw new ForbiddenException('Доступ запрещен. Вы не являетесь создателем этого опроса.');
    }
    
    const responses = await this.responseModel.find({ surveyId: id }).exec();
    const totalResponses = responses.length;

    // Статистика по каждому вопросу через агрегацию
    const questionStats = survey.questions.map((question, qIndex) => {
      const optionCounts: Record<number, number> = {};
      question.options.forEach((_, oIndex) => {
        optionCounts[oIndex] = 0;
      });

      responses.forEach((response) => {
        const answer = response.answers[qIndex];
        if (answer !== undefined && answer < question.options.length) {
          optionCounts[answer] = (optionCounts[answer] || 0) + 1;
        }
      });

      return {
        questionIndex: qIndex,
        questionText: question.text,
        optionCounts: Object.entries(optionCounts).map(([index, count]) => ({
          optionIndex: parseInt(index),
          optionText: question.options[parseInt(index)],
          count,
          percentage: totalResponses > 0 ? (count / totalResponses) * 100 : 0,
        })),
      };
    });

    return {
      survey: {
        _id: survey._id,
        title: survey.title,
      },
      totalResponses,
      questionStats,
    };
  }
}
