import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SurveyDocument = Survey & Document;

class Question {
  @Prop({ required: true })
  text: string;

  @Prop({ type: [String], required: true })
  options: string[];

  @Prop()
  correctOptionIndex?: number;
}

@Schema({ timestamps: true })
export class Survey {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, enum: ['quiz', 'feedback'] })
  type: 'quiz' | 'feedback';

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ type: [Object], required: true })
  questions: Question[];
}

export const SurveySchema = SchemaFactory.createForClass(Survey);

