import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ValidateNested } from 'class-validator';
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
}
