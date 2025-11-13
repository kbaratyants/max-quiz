import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class QuestionDto {
  @ApiProperty({ example: 'Что выведет console.log(typeof null)?', description: 'Текст вопроса' })
  @IsString()
  question: string;

  @ApiProperty({ example: ['null', 'object', 'undefined', 'number'], description: 'Варианты ответов' })
  @IsArray()
  options: string[];

  @ApiProperty({ example: 1, description: 'Индекс правильного ответа' })
  @IsNumber()
  correctAnswer: number;
}

export class CreateQuizDto {
  @ApiProperty({ example: 'Тест по JavaScript', description: 'Название квиза' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '10 вопросов о JS', description: 'Описание квиза' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ type: [QuestionDto], description: 'Список вопросов квиза' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}
