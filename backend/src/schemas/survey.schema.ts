import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SurveyDocument = Survey & Document;

class Question {
  @Prop({ required: true })
  text: string;

  @Prop({ type: [String], required: true })
  options: string[];
}

@Schema({ timestamps: true })
export class Survey {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  ownerId: string;

  @Prop({ type: [Object], required: true })
  questions: Question[];
}

export const SurveySchema = SchemaFactory.createForClass(Survey);

