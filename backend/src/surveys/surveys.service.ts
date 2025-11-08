import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Survey, SurveyDocument } from '../schemas/survey.schema';
import { Response, ResponseDocument } from '../schemas/response.schema';
import { CreateSurveyDto } from './dto/create-survey.dto';

@Injectable()
export class SurveysService {
  constructor(
    @InjectModel(Survey.name) private surveyModel: Model<SurveyDocument>,
    @InjectModel(Response.name) private responseModel: Model<ResponseDocument>,
  ) {}

  async createSurvey(dto: CreateSurveyDto, ownerId: string) {
    const survey = new this.surveyModel({
      ...dto,
      ownerId,
    });
    return survey.save();
  }

  async getSurveys(ownerId?: string) {
    if (ownerId) {
      return this.surveyModel.find({ ownerId }).sort({ createdAt: -1 }).exec();
    }
    return this.surveyModel.find().sort({ createdAt: -1 }).exec();
  }

  async getSurveyById(id: string) {
    const survey = await this.surveyModel.findById(id).exec();
    if (!survey) {
      throw new NotFoundException('Опрос не найден');
    }
    return survey;
  }

  async createResponse(surveyId: string, answers: number[], userId?: string) {
    const survey = await this.getSurveyById(surveyId);
    
    let score: number | undefined;
    if (survey.type === 'quiz') {
      score = 0;
      survey.questions.forEach((q, index) => {
        if (q.correctOptionIndex !== undefined && answers[index] === q.correctOptionIndex) {
          score!++;
        }
      });
    }

    const response = new this.responseModel({
      surveyId,
      userId: userId ? userId : undefined,
      answers,
      score,
    });
    return response.save();
  }

  async getSurveyStats(id: string) {
    const survey = await this.getSurveyById(id);
    
    const responses = await this.responseModel.find({ surveyId: id }).exec();
    
    const totalResponses = responses.length;
    const avgScore = survey.type === 'quiz' && responses.length > 0
      ? responses.reduce((sum, r) => sum + (r.score || 0), 0) / responses.length
      : undefined;

    // Статистика по каждому вопросу
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
        type: survey.type,
      },
      totalResponses,
      avgScore,
      questionStats,
    };
  }
}

