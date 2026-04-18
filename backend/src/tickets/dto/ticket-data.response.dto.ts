import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketCategory } from '../../common/enums/ticket-category.enum';
import { TicketPriority } from '../../common/enums/ticket-priority.enum';
import { TicketStatus } from '../../common/enums/ticket-status.enum';
import { TriageStatus } from '../../common/enums/triage-status.enum';

/** Serialized ticket document returned in API envelopes. */
export class TicketResponseDto {
  @ApiProperty({ description: 'MongoDB document id' })
  _id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  customer_email: string;

  @ApiProperty({ enum: TicketStatus })
  status: TicketStatus;

  @ApiProperty({ enum: TicketPriority })
  priority: TicketPriority;

  @ApiProperty({ enum: TicketCategory })
  category: TicketCategory;

  @ApiProperty({ enum: TriageStatus })
  triageStatus: TriageStatus;

  @ApiPropertyOptional()
  triageError?: string;

  @ApiPropertyOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;

  @ApiPropertyOptional()
  __v?: number;
}
