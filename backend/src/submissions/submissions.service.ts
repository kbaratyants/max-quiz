import {
  Injectable,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Submission } from './schemas/submission.schema';
import { QuizzesService } from '../quizzes/quizzes.service';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectModel(Submission.name) private submissionModel: Model<Submission>,
    @Inject(forwardRef(() => QuizzesService))
    private quizzesService: QuizzesService,
  ) {}

  async submitQuiz(quizId: string, user: any, answers: number[]) {
    const quiz = await this.quizzesService.findById(quizId);
    if (!quiz) throw new Error('Quiz not found');

    if (!quiz.isActive) throw new BadRequestException('Квиз закрыт для прохождения');

    const existing = await this.submissionModel.findOne({ quizId, userId: user.id });
    if (existing) throw new BadRequestException('Вы уже проходили этот квиз');

    const score = answers.reduce((acc, ans, idx) => {
      if (quiz.questions[idx]?.correctAnswer === ans) return acc + 1;
      return acc;
    }, 0);

    const submission = await this.submissionModel.create({
      quizId,
      userId: user?.id,
      userName: `${user?.first_name} ${user?.last_name}`,
      answers,
      score,
      submittedAt: new Date(),
    });

    return {
      score,
      total: quiz.questions.length,
      submissionId: submission._id,
    };
  }

  async getUserSubmissionsSummary(userId: string) {
    const submissions = await this.submissionModel.find({ userId });
    const result = [];

    for (let i = 0; i < submissions.length; i++) {
      const sub = submissions[i];
      const quiz = await this.quizzesService.findById(sub.quizId);
      if (!quiz) continue;
      result.push({
        pp: i + 1,
        submissionId: sub._id,
        quizId: quiz._id,
        quizTitle: quiz.title,
        score: sub.score,
        total: quiz.questions.length,
        submittedAt: sub.submittedAt,
      });
    }
    return result;
  }

  async getSubmissionDetail(submissionId: string, userId: string) {
    const submission = await this.submissionModel.findOne({
      _id: submissionId,
      userId,
    });
    if (!submission) throw new Error('Submission not found');

    const quiz = await this.quizzesService.findById(submission.quizId);
    if (!quiz) throw new Error('Quiz not found');

    const questions = quiz.questions.map((q, idx) => ({
      question: q.question,
      options: q.options,
      selectedAnswer: submission.answers[idx],
      correctAnswer: q.correctAnswer,
    }));

    return {
      quizTitle: quiz.title,
      score: submission.score,
      total: quiz.questions.length,
      submittedAt: submission.submittedAt,
      questions,
    };
  }

  async getQuizResults(quizId: string) {
    const submissions = await this.submissionModel
      .find({ quizId })
      .sort({ score: -1 })
      .lean();

    return submissions.map(s => ({
      userId: s.userId,
      userName: s.userName || s.userId,
      score: s.score,
      submittedAt: s.submittedAt,
    }));
  }
}
