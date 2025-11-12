import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { Quiz, QuizSchema } from '../quizzes/schemas/quiz.schema';
import { Submission, SubmissionSchema } from '../submissions/schemas/submission.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Quiz.name, schema: QuizSchema }]),
    MongooseModule.forFeature([{ name: Submission.name, schema: SubmissionSchema }]),
  ],
  providers: [SeedService],
  controllers: [SeedController],
})
export class SeedModule {}
