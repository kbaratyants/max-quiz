import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Bot, Context } from '@maxhub/max-bot-api';
import { QuizzesService } from '../quizzes/quizzes.service';
import { SubmissionsService } from '../submissions/submissions.service';

@Injectable()
export class BotService implements OnModuleInit {
  private readonly logger = new Logger(BotService.name);
  private static initialized = false;
  private bot: Bot;

  constructor(
    private readonly quizzesService: QuizzesService,
    private readonly submissionsService: SubmissionsService,
  ) {}

  onModuleInit() {
    if (BotService.initialized) return; // предотвращаем второй запуск
    BotService.initialized = true;
    const token =
      process.env.MAX_DEV_TOKEN;
    if (!token) {
      this.logger.warn('BOT_TOKEN не найден в окружении. Бот не будет запущен.');
      return;
    }

    this.bot = new Bot(token);

    // ========================
    // Настройка команд
    // ========================
    this.bot.api.setMyCommands([
      { name: 'hello', description: 'Поприветствовать бота' },
      { name: 'create', description: 'Создать тест (демо)' },
      { name: 'quizzes', description: 'Посмотреть свои тесты' },
      { name: 'take', description: 'Пройти тест по ID' },
      { name: 'results', description: 'Посмотреть свои результаты' },
    ]);

    // ========================
    // Обработчики команд
    // ========================
    this.bot.command('hello', (ctx) => this.handleHello(ctx));
    this.bot.command('create', (ctx) => this.handleCreateQuiz(ctx));
    this.bot.command('quizzes', (ctx) => this.handleQuizzes(ctx));
    this.bot.hears(/^\/take\s*(.*)$/, (ctx) => this.handleTakeQuiz(ctx));
    this.bot.command('results', (ctx) => this.handleResults(ctx));

    this.bot.start();
    this.logger.log('✅ MAX Quiz Bot запущен и готов к работе');
  }

  // ========================
  // Команды
  // ========================

  private async handleHello(ctx: Context) {
    const user = ctx.user;
    const name = user?.name || 'друг';
    await ctx.reply(`Привет, ${name}! 👋\nЯ — MAX Quiz Bot. Используй команды:\n\n` +
      `/create — создать тест\n` +
      `/myquizzes — мои тесты\n` +
      `/take <quizId> — пройти тест\n` +
      `/results — мои результаты`);
  }

  private async handleCreateQuiz(ctx: Context) {
    await ctx.reply('🛠 Создаю тест...');

    const quiz = await this.quizzesService.create(
      {
        title: 'Тест через бота',
        description: 'Короткое описание теста',
        questions: [
          {
            question: 'Сколько будет 2 + 2?',
            options: ['3', '4', '5'],
            correctAnswer: 1,
          },
        ],
      },
      { id: ctx.user.user_id.toString(), name: ctx.user.name },
    );

    await ctx.reply(`✅ Тест создан!\nID: ${quiz.quiz._id}, ${quiz.publicUrl}`);
  }

  private async handleQuizzes(ctx: Context) {
    const quizzes = await this.quizzesService.findAllByAuthor(ctx.user.user_id.toString());
    if (!quizzes.length) {
      return ctx.reply('У тебя пока нет созданных тестов.');
    }

    const list = quizzes.map((q) => `• ${q.title} (id: ${q._id})`).join('\n');
    await ctx.reply(`📋 Твои тесты:\n${list}`);
  }

  private async handleTakeQuiz(ctx: Context) {
    const text = ctx.message?.body?.text || '';
    const args = text.split(' ');
    const quizId = args[1];

    if (!quizId) {
      return ctx.reply('❗ Укажи ID теста: /take <quizId>');
    }

    this.logger.log(`Пользователь запустил квиз с ID: ${quizId}`);

    try {
      const quiz = await this.quizzesService.findById(quizId);
      if (!quiz) {
        return ctx.reply('😕 Квиз не найден.');
      }

      // Сообщаем о начале квиза
      await ctx.reply(
        `🧠 Начинаем квиз: "${quiz.title}"\nВсего вопросов: ${quiz.questions.length}`,
      );

      // Формируем массив ответов с правильными вариантами
      const answers = quiz.questions.map((q) => q.correctAnswer);

      // Отправляем сабмишн
      const submission = await this.submissionsService.submitQuiz(
        quiz._id.toString(),
        { id: ctx.user?.user_id, name: ctx.user?.name }, // user object
        answers,
      );

      // Сообщаем результат
      await ctx.reply(
        `✅ Квиз "${quiz.title}" пройден автоматически!\n` +
        `Баллы: ${submission.score}/${submission.total}`,
      );
    } catch (err) {
      this.logger.error(err);
      return await ctx.reply(`❌ Произошла ошибка при прохождении квиза "${ctx.user.name}".`);
    }
  }


  private async handleResults(ctx: Context) {
    const results = await this.submissionsService.getUserSubmissionsSummary(ctx.user.user_id.toString());
    if (!results.length) {
      return ctx.reply('Нет результатов прохождений.');
    }

    const text = results
      .map(
        (r) =>
          `${r.quizTitle}: ${r.score}/${r.total} (${new Date(r.submittedAt).toLocaleDateString()})`,
      )
      .join('\n');

    await ctx.reply(`📊 Твои результаты:\n${text}`);
  }

  // ========================
  // Утилита: отправка сообщений
  // ========================
  async sendMessage(chatId: number, text: string) {
    if (!this.bot) return;
    try {
      await this.bot.api.sendMessageToChat(chatId, text);
      this.logger.log(`Сообщение отправлено пользователю ${chatId}`);
    } catch (err) {
      this.logger.error(`Ошибка при отправке сообщения: ${err.message}`);
    }
  }
}
