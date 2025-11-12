import { IsArray, ArrayNotEmpty, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitQuizDto {
  @ApiProperty({
    description: 'Массив выбранных пользователем ответов (индексы вариантов)',
    example: [0, 1, 2, 0],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(0, { each: true })
  answers: number[];
}
