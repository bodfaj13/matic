import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Ticket, TicketSchema } from './schemas/ticket.schema';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { OpenaiTriageService } from '../triage/openai-triage.service';
import { TriageProcessor } from '../triage/triage.processor';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ticket.name, schema: TicketSchema }]),
    BullModule.registerQueue({
      name: 'triage',
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
      },
    }),
  ],
  controllers: [TicketsController],
  providers: [TicketsService, OpenaiTriageService, TriageProcessor],
  exports: [TicketsService],
})
export class TicketsModule {}
