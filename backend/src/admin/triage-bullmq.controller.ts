import { Controller, Get } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Queue } from 'bullmq';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { QueueStatsResponseDto } from './dto/queue-stats.response.dto';

@ApiTags('admin')
@Controller('admin/triage-bullmq')
export class TriageBullMqController {
  constructor(@InjectQueue('triage') private readonly triageQueue: Queue) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get BullMQ triage queue job counts' })
  @ApiOkResponse({ type: QueueStatsResponseDto })
  @ApiInternalServerErrorResponse({ type: ErrorResponseDto })
  async stats() {
    return this.triageQueue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
      'paused',
    );
  }
}
