import {
  Controller,
  Patch,
  Param,
  Body,
  Req,
  Get,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SubmissionsService } from './submissions.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { SubmissionDetailDto } from './dto/submission-response.dto';
import { Request } from 'express';

@ApiTags('submissions')
@Controller('submissions')
export class SubmissionsController {
  constructor(private submissionsService: SubmissionsService) {}

  @Patch('quiz/:id/submit')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiParam({ name: 'id', description: 'ID квиза', example: '64a1b2c3d4e5f67890123456' })
  @ApiBody({ type: SubmitQuizDto, description: 'Массив выбранных ответов' })
  @ApiResponse({ status: 201, description: 'Сабмишен успешно создан', type: SubmissionDetailDto })
  async submitQuiz(
    @Param('id') quizId: string,
    @Body() dto: SubmitQuizDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user || { id: 'test-author', first_name: 'Test User' };
    return this.submissionsService.submitQuiz(quizId, user, dto.answers);
  }

  @Get('user/me/summary')
  @ApiResponse({ status: 200, description: 'Сводка всех сабмишенов пользователя', type: [SubmissionDetailDto] })
  async getUserSubmissionsSummary(@Req() req: Request) {
    const user = (req as any).user || { id: 'test-author' };
    return this.submissionsService.getUserSubmissionsSummary(user.id);
  }

  @Get('user/me/:id')
  @ApiParam({ name: 'id', description: 'ID сабмишена', example: '64a1b2c3d4e5f67890123456' })
  @ApiResponse({ status: 200, description: 'Детали сабмишена', type: SubmissionDetailDto })
  async getSubmissionDetail(
    @Param('id') submissionId: string,
    @Req() req: Request,
  ): Promise<SubmissionDetailDto> {
    const user = (req as any).user || { id: 'test-author' };
    return this.submissionsService.getSubmissionDetail(submissionId, user.id);
  }
}
