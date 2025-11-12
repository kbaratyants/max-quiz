import { ApiProperty } from '@nestjs/swagger';

export class SubmissionQuestionDto {
  @ApiProperty({
    description: 'Текст вопроса',
    example: 'Что выведет console.log(typeof null)?',
  })
  question: string;

  @ApiProperty({
    description: 'Варианты ответа',
    example: ['null', 'object', 'undefined', 'number'],
  })
  options: string[];

  @ApiProperty({
    description: 'Выбранный пользователем вариант (индекс)',
    example: 1,
  })
  selectedAnswer: number;

  @ApiProperty({ description: 'Правильный вариант (индекс)', example: 1 })
  correctAnswer: number;
}
  
export class SubmissionDetailDto {
  @ApiProperty({ description: 'Название квиза', example: 'Тест по JavaScript' })
  quizTitle: string;

  @ApiProperty({ description: 'Количество правильных ответов', example: 3 })
  score: number;

  @ApiProperty({ description: 'Общее количество вопросов', example: 5 })
  total: number;

  @ApiProperty({ description: 'Дата и время прохождения квиза', example: '2025-11-11T14:00:00Z' })
  submittedAt: Date;

  @ApiProperty({ type: [SubmissionQuestionDto], description: 'Список вопросов с выбранными и правильными ответами' })
  questions: SubmissionQuestionDto[];
}
