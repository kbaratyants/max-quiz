import { Controller, Get, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { ResponsesService } from './responses.service';

@ApiTags('responses')
@Controller('responses')
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Get('mine')
  @ApiOperation({ summary: 'Получить список пройденных мной опросов' })
  @ApiHeader({ name: 'x-client-id', required: true, description: 'ID клиента' })
  async getMyResponses(@Headers('x-client-id') clientId: string) {
    return this.responsesService.getMyResponses(clientId);
  }
}

