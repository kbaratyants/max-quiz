import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Submission extends Document {
  @Prop({ required: true })
  quizId: string;

  @Prop()
  userId?: string;

  @Prop({ type: [Number], required: true })
  answers: number[];

  @Prop({ required: true })
  score: number;

  @Prop({ default: () => new Date() })
  submittedAt: Date;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);

SubmissionSchema.index({ quizId: 1 });
SubmissionSchema.index({ userId: 1 });
