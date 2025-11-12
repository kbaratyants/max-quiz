import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UsePipes,
  ValidationPipe,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { Request } from 'express';

@ApiTags('quizzes')
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiBody({ type: CreateQuizDto, description: 'Данные для создания квиза' })
  @ApiResponse({
    status: 201,
    description: 'Квиз успешно создан',
    schema: {
      example: {
        status: 'ok',
        data: {
          quizId: '64a1b2c3d4e5f67890123456',
          publicUrl: 'http://localhost:3000/quiz/64a1b2c3d4e5f67890123456',
          qrDataUrl: 'data:image/png;base64,...',
        },
      },
    },
  })
  async create(@Body() dto: CreateQuizDto, @Req() req: Request) {
    const user = (req as any).user || { id: 'test-author', first_name: 'Test User' };
    const result = await this.quizzesService.create(dto, user);

    return {
      status: 'ok',
      data: {
        quizId: result.quiz._id,
        publicUrl: result.publicUrl,
      },
    };
  }

  // ВАЖНО: Специфичные роуты должны быть ПЕРЕД параметризованными
  @Get('my/stats/:id')
  @ApiParam({ name: 'id', description: 'ID квиза', example: '64a1b2c3d4e5f67890123456' })
  @ApiResponse({
    status: 200,
    description: 'Детальная статистика по квизу (по каждому вопросу)',
    schema: {
      example: {
        quizId: '64a1b2c3d4e5f67890123456',
        title: 'Тест по JavaScript',
        questions: [
          {
            question: 'Что выведет console.log(typeof null)?',
            options: ['null', 'object', 'undefined', 'number'],
            averageScore: 0.6,
            attempts: 5,
          },
        ],
      },
    },
  })
  async getQuizDetailedStats(@Param('id') quizId: string) {
    return this.quizzesService.getQuizDetailedStats(quizId);
  }

  @Get('my/stats')
  @ApiResponse({
    status: 200,
    description: 'Статистика всех квизов текущего пользователя (средний балл, количество прохождений)',
    schema: {
      example: [
        {
          quizId: '64a1b2c3d4e5f67890123456',
          title: 'Тест по JavaScript',
          averageScore: 3.2,
          attempts: 5,
        },
      ],
    },
  })
  async getMyQuizzesStats(@Req() req: Request) {
    const user = (req as any).user || { id: 'test-author' };
    return this.quizzesService.getQuizzesStats(user.id);
  }

  @Get('my')
  @ApiResponse({
    status: 200,
    description: 'Список квизов текущего пользователя',
    type: [CreateQuizDto], // Можно указать реальный тип, если есть QuizDto
  })
  async getMyQuizzes(@Req() req: Request) {
    const user = (req as any).user || { id: 'test-author' };
    return this.quizzesService.findAllByAuthor(user.id);
  }

  @Get('all')
  @ApiResponse({
    status: 200,
    description: 'Список всех квизов',
    type: [CreateQuizDto],
  })
  async getAllQuizzes() {
    return this.quizzesService.findAll();
  }

  // ==============================
  // Поиск квиза по ID (должен быть последним, чтобы не перехватывать специфичные роуты)
  // ==============================
  @Get(':id')
  @ApiParam({ name: 'id', description: 'ID квиза', example: '64a1b2c3d4e5f67890123456' })
  @ApiResponse({
    status: 200,
    description: 'Возвращает данные квиза по его ID',
    schema: {
      example: {
        quizId: '64a1b2c3d4e5f67890123456',
        title: 'Тест по JavaScript',
        description: 'Базовый тест для проверки знаний JS',
        questions: [
          {
            question: 'Что выведет console.log(typeof null)?',
            options: ['null', 'object', 'undefined', 'number'],
          },
        ],
        authorId: 'test-author',
      },
    },
  })
  async getQuizById(@Param('id') quizId: string) {
    const quiz = await this.quizzesService.findById(quizId);
    if (!quiz) {
      return { status: 'error', message: 'Квиз не найден' };
    }
    return { status: 'ok', data: quiz };
  }
}
