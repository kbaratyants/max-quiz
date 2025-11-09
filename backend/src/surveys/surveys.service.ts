import { Injectable, NotFoundException, ForbiddenException, GoneException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Survey, SurveyDocument } from '../schemas/survey.schema';
import { Response, ResponseDocument } from '../schemas/response.schema';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';

@Injectable()
export class SurveysService {
  constructor(
    @InjectModel(Survey.name) private surveyModel: Model<SurveyDocument>,
    @InjectModel(Response.name) private responseModel: Model<ResponseDocument>,
  ) {}

  private generatePublicId(): string {
    return nanoid(8); // Короткий ID из 8 символов
  }

  private checkSurveyAvailability(survey: SurveyDocument): void {
    if (survey.isClosed) {
      throw new GoneException('Опрос закрыт');
    }
    if (survey.expiresAt && new Date(survey.expiresAt) < new Date()) {
      throw new GoneException('Срок действия опроса истёк');
    }
  }

  async createSurvey(dto: CreateSurveyDto, ownerId: string, frontendBaseUrl: string) {
    const publicId = this.generatePublicId();
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;

    const survey = new this.surveyModel({
      title: dto.title,
      questions: dto.questions,
      ownerId: ownerId || 'teacher-1',
      expiresAt,
      timeLimitSec: dto.timeLimitSec,
      isClosed: false,
      publicId,
    });

    const savedSurvey = await survey.save();
    const shareUrl = `${frontendBaseUrl}/survey/${publicId}`;

    return {
      surveyId: savedSurvey._id.toString(),
      publicId: savedSurvey.publicId,
      shareUrl,
      qrData: shareUrl,
      isClosed: savedSurvey.isClosed,
    };
  }

  async getMySurveys(ownerId: string, frontendBaseUrl: string) {
    const surveys = await this.surveyModel.find({ ownerId }).sort({ createdAt: -1 }).exec();
    
    return surveys.map((survey) => {
      // Для старых опросов без publicId генерируем его
      if (!survey.publicId) {
        survey.publicId = this.generatePublicId();
        survey.save();
      }
      
      const shareUrl = `${frontendBaseUrl}/survey/${survey.publicId}`;
      const isExpired = survey.expiresAt && new Date(survey.expiresAt) < new Date();
      
      return {
        _id: survey._id,
        title: survey.title,
        createdAt: survey.createdAt,
        publicId: survey.publicId,
        shareUrl,
        isClosed: survey.isClosed,
        expiresAt: survey.expiresAt,
        isExpired,
        questionsCount: survey.questions?.length || 0,
      };
    });
  }

  async getSurveyById(id: string) {
    const survey = await this.surveyModel.findById(id).exec();
    if (!survey) {
      throw new NotFoundException('Опрос не найден');
    }
    return survey;
  }

  async getSurveyByPublicId(publicId: string) {
    const survey = await this.surveyModel.findOne({ publicId }).exec();
    if (!survey) {
      throw new NotFoundException('Опрос не найден');
    }
    
    this.checkSurveyAvailability(survey);
    
    return {
      _id: survey._id,
      title: survey.title,
      questions: survey.questions,
      timeLimitSec: survey.timeLimitSec,
    };
  }

  async closeSurvey(id: string, ownerId: string) {
    const survey = await this.getSurveyById(id);
    
    if (survey.ownerId !== ownerId) {
      throw new ForbiddenException('Доступ запрещен. Вы не являетесь создателем этого опроса.');
    }

    survey.isClosed = true;
    await survey.save();
    
    return { message: 'Опрос закрыт', isClosed: true };
  }

  async createResponse(surveyId: string, answers: number[], clientId?: string) {
    const survey = await this.getSurveyById(surveyId);
    
    this.checkSurveyAvailability(survey);
    
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
