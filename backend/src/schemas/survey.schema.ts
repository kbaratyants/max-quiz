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

  @Prop()
  expiresAt?: Date;

  @Prop()
  timeLimitSec?: number;

  @Prop({ default: false })
  isClosed: boolean;

  @Prop({ required: true, unique: true })
  publicId: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SurveySchema = SchemaFactory.createForClass(Survey);

