import { ApiProperty } from '@nestjs/swagger';

export class QueueStatsResponseDto {
  @ApiProperty()
  waiting: number;

  @ApiProperty()
  active: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  failed: number;

  @ApiProperty()
  delayed: number;

  @ApiProperty()
  paused: number;
}
