import { Module, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizzesModule } from './quizzes/quizzes.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { MaxAuthMiddleware } from './common/middlewares/max-auth.middleware';
import { SeedModule } from './seed/seed.module';
import { TestAuthMiddleware } from './common/middlewares/test-auth.middleware';
import { BotModule } from './bot/bot.module';
import { BotService } from './bot/bot.service';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI),
    BotModule,
    QuizzesModule,
    SubmissionsModule,
    SeedModule,
  ],
  providers: [BotService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    if (process.env.NODE_ENV === 'development') {
      consumer.apply(TestAuthMiddleware).forRoutes('*');
    } else {
      consumer.apply(MaxAuthMiddleware).forRoutes('*');
    }
  }
}
