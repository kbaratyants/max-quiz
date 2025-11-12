import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { QuizzesModule } from '../quizzes/quizzes.module';
import { SubmissionsModule } from '../submissions/submissions.module';

@Module({
  imports: [
    QuizzesModule,       // чтобы BotService мог использовать QuizzesService
    SubmissionsModule,   // чтобы использовать SubmissionsService
  ],
  providers: [BotService],
  exports: [BotService], // если ты хочешь использовать бот где-то ещё
})
export class BotModule {}
