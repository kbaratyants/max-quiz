import { Controller, Get, Post, Body, Param, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { SurveysService } from './surveys.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { CreateResponseDto } from './dto/create-response.dto';

@ApiTags('surveys')
@Controller('surveys')
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  @Post()
  @ApiOperation({ summary: 'Создать опрос' })
  @ApiHeader({ name: 'x-user-id', required: false, description: 'ID создателя опроса' })
  async createSurvey(
    @Body() dto: CreateSurveyDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.surveysService.createSurvey(dto, userId || 'teacher-1');
  }

  @Get('mine')
  @ApiOperation({ summary: 'Получить список созданных мной опросов' })
  @ApiHeader({ name: 'x-user-id', required: true, description: 'ID пользователя' })
  async getMySurveys(@Headers('x-user-id') userId: string) {
    return this.surveysService.getMySurveys(userId || 'teacher-1');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить опрос по ID' })
  async getSurvey(@Param('id') id: string) {
    return this.surveysService.getSurveyById(id);
  }

  @Post(':id/responses')
  @ApiOperation({ summary: 'Отправить ответы на опрос' })
  @ApiHeader({ name: 'x-client-id', required: false, description: 'ID клиента' })
  async createResponse(
    @Param('id') surveyId: string,
    @Body() dto: CreateResponseDto,
    @Headers('x-client-id') clientId?: string,
  ) {
    return this.surveysService.createResponse(surveyId, dto.answers, clientId);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Получить статистику по опросу (только для создателя)' })
  @ApiHeader({ name: 'x-user-id', required: true, description: 'ID создателя опроса' })
  async getStats(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.surveysService.getSurveyStats(id, userId || 'teacher-1');
  }
}
