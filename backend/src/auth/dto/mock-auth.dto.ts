import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class MockAuthDto {
  @ApiProperty({ example: 'user123', description: 'ID пользователя в MAX' })
  @IsString()
  maxId: string;

  @ApiProperty({ example: 'teacher', enum: ['teacher', 'student'], description: 'Роль пользователя' })
  @IsString()
  @IsIn(['teacher', 'student'])
  role: 'teacher' | 'student';
}

