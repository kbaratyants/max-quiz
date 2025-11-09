import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ValidateNested, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

class QuestionDto {
  @ApiProperty({ example: 'Какой язык программирования вы изучаете?', description: 'Текст вопроса' })
  @IsString()
  text: string;

  @ApiProperty({ example: ['JavaScript', 'Python', 'Java', 'C++'], description: 'Варианты ответов', type: [String] })
  @IsArray()
  @IsString({ each: true })
  options: string[];
}

export class CreateSurveyDto {
  @ApiProperty({ example: 'Опрос по программированию', description: 'Название опроса' })
  @IsString()
  title: string;

  @ApiProperty({ type: [QuestionDto], description: 'Вопросы опроса' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];

  @ApiProperty({ example: '2024-12-31T23:59:59.000Z', description: 'Время истечения опроса (ISO строка)', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ example: 300, description: 'Таймер на прохождение в секундах', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  timeLimitSec?: number;
}
