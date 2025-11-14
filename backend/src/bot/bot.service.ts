import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Bot, Context } from '@maxhub/max-bot-api';

@Injectable()
export class BotService implements OnModuleInit {
  private readonly logger = new Logger(BotService.name);
  private static initialized = false;
  private bot: Bot;

  onModuleInit() {
    if (BotService.initialized) return;
    BotService.initialized = true;

    const token = process.env.MAX_DEV_TOKEN;
    if (!token) {
      this.logger.warn('MAX_DEV_TOKEN не найден. Бот не будет запущен.');
      return;
    }

    this.bot = new Bot(token);

    this.bot.api.setMyCommands([
      { name: 'start', description: 'Приветствие' },
      { name: 'info', description: 'О боте и мини-аппе' },
    ]);

    this.bot.command('start', (ctx) => this.handleStart(ctx));
    this.bot.command('hello', (ctx) => this.handleHello(ctx));

    this.bot.start();
    this.logger.log('✅ MAX Quiz Bot запущен');
  }

  private async handleStart(ctx: Context) {
    const name = ctx.user?.name || 'друг';

    await ctx.reply(
      `👋 Привет, ${name}!\n\n` +
      `Я — бот мини-приложения **MAX Quiz**.\n` +
      `Здесь преподаватели могут быстро создавать тесты,\n` +
      `а студенты — проходить их прямо внутри MAX.\n\n` +
      `👉 Напиши /hello чтобы узнать подробнее.\n` +
      `👉 Или просто открой приложение: /app`,
      { format: 'markdown' }
    );
  }

  private async handleHello(ctx: Context) {
    await ctx.reply(
      `📚 **Что умеет MAX Quiz?**\n\n` +
      `• Создание тестов за 1 минуту\n` +
      `• Прохождение квизов студентами\n` +
      `• Быстрые результаты и статистика\n` +
      `• Сканирование QR-кодов прямо в приложении\n` +
      `• Авторизация через MAX (ничего не нужно вводить)\n\n` +
      `✨ Нажми /app чтобы открыть мини-апп`,
      { format: 'markdown' }
    );
  }
}
