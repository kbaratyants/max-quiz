import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class CreateResponseDto {
  @ApiProperty({ example: [0, 1, 2], description: 'Массив индексов выбранных ответов', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  answers: number[];
}

