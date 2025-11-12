import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Quiz extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: Array, default: [] })
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];

  @Prop({ required: true })
  authorId: string;

  @Prop()
  authorName: string;

  @Prop({ unique: true })
  uuid: string;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
