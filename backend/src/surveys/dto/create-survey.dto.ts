import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, ValidateNested, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class QuestionDto {
  @ApiProperty({ example: 'Какой язык программирования вы изучаете?', description: 'Текст вопроса' })
  @IsString()
  text: string;

  @ApiProperty({ example: ['JavaScript', 'Python', 'Java', 'C++'], description: 'Варианты ответов', type: [String] })
  @IsArray()
  @IsString({ each: true })
  options: string[];

  @ApiProperty({ example: 0, description: 'Индекс правильного ответа (только для quiz)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  correctOptionIndex?: number;
}

export class CreateSurveyDto {
  @ApiProperty({ example: 'Опрос по программированию', description: 'Название опроса' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'quiz', enum: ['quiz', 'feedback'], description: 'Тип опроса' })
  @IsEnum(['quiz', 'feedback'])
  type: 'quiz' | 'feedback';

  @ApiProperty({ type: [QuestionDto], description: 'Вопросы опроса' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}

