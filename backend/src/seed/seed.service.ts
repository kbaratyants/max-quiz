import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quiz } from '../quizzes/schemas/quiz.schema';
import { Submission } from '../submissions/schemas/submission.schema';
import { randomUUID } from 'crypto';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>,
    @InjectModel(Submission.name) private submissionModel: Model<Submission>,
  ) {}

  async generateTestData() {
    // 🔹 Тестовые квизы
    const quizzesData = [
      {
        title: 'JavaScript Basics',
        description: 'Тест по основам JS',
        questions: [
          { question: 'typeof null?', options: ['null', 'object', 'undefined', 'number'], correctAnswer: 1 },
          { question: 'Что такое closure?', options: ['Функция', 'Объект', 'Переменная', 'Класс'], correctAnswer: 0 },
        ],
      },
      {
        title: 'HTML & CSS',
        description: 'Вопросы по верстке',
        questions: [
          { question: 'Как задать фон?', options: ['color', 'background', 'bg', 'fill'], correctAnswer: 1 },
        ],
      },
      {
        title: 'Node.js',
        description: 'Основы Node.js',
        questions: [
          { question: 'Что такое event loop?', options: ['Цикл событий', 'Функция', 'Объект', 'Модуль'], correctAnswer: 0 },
        ],
      },
    ];

    const createdQuizzes = [];

    // 🔹 Создаем квизы
    for (const q of quizzesData) {
      const uuid = randomUUID();
      const publicUrl = `http://localhost:3000/quiz/${uuid}`;
      const quiz = await this.quizModel.create({
        ...q,
        authorId: 'test-author',
        authorName: 'Test User',
        uuid,
        publicUrl,
        qrDataUrl: '', // QR код можно генерировать при необходимости
      });
      createdQuizzes.push(quiz);
    }

    // 🔹 Создаем прохождения для всех квизов
    for (const quiz of createdQuizzes) {
      for (let i = 0; i < 5; i++) {
        // answers — массив чисел (индексы выбранных вариантов)
        const answers = quiz.questions.map(
          (q) => Math.floor(Math.random() * q.options.length)
        );

        await this.submissionModel.create({
          quizId: quiz._id,
          userId: 'test-author',
          userName: `Test User ${i + 1}`,
          answers,
          score: answers.filter(
            (ans, idx) => ans === quiz.questions[idx].correctAnswer
          ).length,
        });
      }
    }

    return { quizzes: createdQuizzes.length, submissions: createdQuizzes.length * 5 };
  }
}
