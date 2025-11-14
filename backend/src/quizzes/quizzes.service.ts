import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quiz } from './schemas/quiz.schema';
import { Submission } from '../submissions/schemas/submission.schema';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { nanoid } from 'nanoid';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>,
    @InjectModel(Submission.name) private submissionModel: Model<Submission>,
  ) {}

  async create(dto: CreateQuizDto, user: any) {
    let shortId: string;
    do {
      shortId = nanoid(8).toUpperCase();
    } while (await this.quizModel.exists({ shortId }));

    const quiz = await this.quizModel.create({
      title: dto.title,
      description: dto.description,
      questions: dto.questions,
      authorId: user.id,
      authorName: user.first_name,
      shortId: shortId,
    });

    const botName = process.env.BOT_NAME || 't39_hakaton_bot';
    const startParam = encodeURIComponent(quiz.shortId.toString());
    const publicUrl = `https://max.ru/${botName}?startapp=${startParam}`;

    //const publicUrl = `${process.env.BASE_URL}/api/quizzes/${quiz._id}`;
    return { quiz, publicUrl, shortId };
  }

  async findAll() {
    return this.quizModel.find();
  }

  async findAllByAuthor(authorId: string) {
    return this.quizModel.find({ authorId });
  }

  async findById(quizId: string) {
    return this.quizModel.findById(quizId);
  }

  async findByShortId(shortId: string) {
    return this.quizModel.findOne({ shortId });
  }

  // ======================
  // Новые методы аналитики
  // ======================

  // Список квизов с метриками: средний балл, количество прохождений
  async getQuizzesStats(authorId: string) {
    const quizzes = await this.quizModel.find({ authorId });
    const result = [];

    for (const quiz of quizzes) {
      const submissions = await this.submissionModel.find({ quizId: quiz._id });
      const totalSubmissions = submissions.length;
      const avgScore = totalSubmissions
        ? submissions.reduce((acc, s) => acc + s.score, 0) / totalSubmissions
        : 0;

      result.push({
        quizId: quiz._id,
        title: quiz.title,
        totalSubmissions,
        avgScore,
      });
    }

    return result;
  }

  // Детальная статистика по каждому вопросу квиза
  async getQuizDetailedStats(quizId: string) {
    const quiz = await this.findById(quizId);
    if (!quiz) throw new Error('Quiz not found');

    const submissions = await this.submissionModel.find({ quizId });

    // Статистика по вопросам
    const questionsStats = quiz.questions.map((q, idx) => {
      const total = submissions.length;
      const correctCount = submissions.reduce((acc, s) => {
        return acc + (s.answers[idx] === q.correctAnswer ? 1 : 0);
      }, 0);
      return {
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        totalAttempts: total,
        correctCount,
        correctPercentage: total ? (correctCount / total) * 100 : 0,
      };
    });

    return {
      quizId: quiz._id,
      title: quiz.title,
      totalSubmissions: submissions.length,
      avgScore: submissions.length
        ? submissions.reduce((acc, s) => acc + s.score, 0) / submissions.length
        : 0,
      questions: questionsStats,
    };
  }

  async closeQuiz(quizId: string, authorId: string) {
    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) throw new NotFoundException('Квиз не найден');
    // Приводим к строке для корректного сравнения (user.id может быть числом из MAX)
    if (String(quiz.authorId) !== String(authorId)) {
      throw new ForbiddenException('Нет доступа');
    }

    quiz.isActive = false;
    await quiz.save();

    return { status: 'ok', message: 'Квиз закрыт' };
  }

  async getQuizForUser(quizId: string, userId?: string) {
    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) return null;

    // Если указали пользователя, проверяем сабмишены
    if (userId) {
      const existing = await this.submissionModel.findOne({ quizId, userId });
      if (existing) {
        throw new BadRequestException('Вы уже проходили этот квиз');
      }
      if (!quiz.isActive) {
        throw new BadRequestException('Квиз закрыт для новых ответов');
      }
    }

    return quiz;
  }

  async getQuizByShortIdForUser(shortId: string, userId?: string) {
    const quiz = await this.quizModel.findOne({ shortId });
    if (!quiz) return null;

    if (userId) {
      // Проверяем, проходил ли уже пользователь этот квиз
      const existing = await this.submissionModel.findOne({
        quizId: quiz._id,
        userId,
      });
      if (existing) {
        throw new BadRequestException('Вы уже проходили этот квиз');
      }

      // Проверяем, закрыт ли квиз для новых ответов
      if (!quiz.isActive) {
        throw new BadRequestException('Квиз закрыт для новых ответов');
      }
    }

    return quiz;
  }
}
