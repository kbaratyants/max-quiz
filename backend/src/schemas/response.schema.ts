import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ResponseDocument = Response & Document;

@Schema({ timestamps: true })
export class Response {
  @Prop({ type: Types.ObjectId, ref: 'Survey', required: true })
  surveyId: Types.ObjectId;

  @Prop({ type: [Number], required: true })
  answers: number[];

  @Prop({ required: true })
  clientId: string;
}

export const ResponseSchema = SchemaFactory.createForClass(Response);

