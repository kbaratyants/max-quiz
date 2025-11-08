import { Controller, Get, Post, Body, Param, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { SurveysService } from './surveys.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { CreateResponseDto } from './dto/create-response.dto';

@ApiTags('surveys')
@Controller('surveys')
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  @Post()
  @ApiOperation({ summary: 'Создать опрос (только для преподавателя)' })
  @ApiHeader({ name: 'x-user-id', description: 'ID пользователя' })
  async createSurvey(
    @Body() dto: CreateSurveyDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.surveysService.createSurvey(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список опросов' })
  @ApiQuery({ name: 'mine', required: false, type: Boolean, description: 'Только мои опросы' })
  @ApiHeader({ name: 'x-user-id', required: false, description: 'ID пользователя' })
  async getSurveys(
    @Query('mine') mine?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    const isMine = mine === 'true';
    return this.surveysService.getSurveys(isMine ? userId : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить опрос по ID' })
  async getSurvey(@Param('id') id: string) {
    return this.surveysService.getSurveyById(id);
  }

  @Post(':id/responses')
  @ApiOperation({ summary: 'Отправить ответы на опрос' })
  @ApiHeader({ name: 'x-user-id', required: false, description: 'ID пользователя' })
  async createResponse(
    @Param('id') surveyId: string,
    @Body() dto: CreateResponseDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.surveysService.createResponse(surveyId, dto.answers, userId);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Получить статистику по опросу' })
  async getStats(@Param('id') id: string) {
    return this.surveysService.getSurveyStats(id);
  }
}

