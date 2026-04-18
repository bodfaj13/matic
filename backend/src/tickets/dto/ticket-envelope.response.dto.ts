import { ApiProperty } from '@nestjs/swagger';
import { TicketResponseDto } from './ticket-data.response.dto';

export class TicketSingleResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  status: boolean;

  @ApiProperty({ type: TicketResponseDto })
  data: TicketResponseDto;

  @ApiProperty()
  statusCode: string;
}

export class TicketsPaginatedResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  status: boolean;

  @ApiProperty({ type: [TicketResponseDto] })
  data: TicketResponseDto[];

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  pageNumber: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  statusCode: string;
}
