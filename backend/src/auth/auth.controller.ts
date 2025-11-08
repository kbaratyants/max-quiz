import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { MockAuthDto } from './dto/mock-auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('mock')
  @ApiOperation({ summary: 'Мок-авторизация для тестирования' })
  @ApiBody({ type: MockAuthDto })
  async mockAuth(@Body() dto: MockAuthDto) {
    return this.authService.mockAuth(dto.maxId, dto.role);
  }
}

