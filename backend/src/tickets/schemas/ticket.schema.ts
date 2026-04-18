import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { TicketCategory } from '../../common/enums/ticket-category.enum';
import { TicketPriority } from '../../common/enums/ticket-priority.enum';
import { TicketStatus } from '../../common/enums/ticket-status.enum';
import { TriageStatus } from '../../common/enums/triage-status.enum';

export type TicketDocument = HydratedDocument<Ticket>;

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, lowercase: true, trim: true })
  customer_email: string;

  @Prop({
    type: String,
    enum: Object.values(TicketStatus),
    default: TicketStatus.Open,
  })
  status: TicketStatus;

  @Prop({
    type: String,
    enum: Object.values(TicketPriority),
    default: TicketPriority.Medium,
  })
  priority: TicketPriority;

  @Prop({
    type: String,
    enum: Object.values(TicketCategory),
    default: TicketCategory.General,
  })
  category: TicketCategory;

  @Prop({
    type: String,
    enum: Object.values(TriageStatus),
    default: TriageStatus.Pending,
  })
  triageStatus: TriageStatus;

  @Prop({ type: String })
  triageError?: string;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

TicketSchema.index({ status: 1, createdAt: -1 });
TicketSchema.index({ priority: 1, createdAt: -1 });
TicketSchema.index({ createdAt: -1 });
TicketSchema.index({ customer_email: 1 });
