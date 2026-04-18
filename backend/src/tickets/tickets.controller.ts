import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';
import { TicketPriority } from '../common/enums/ticket-priority.enum';
import { TicketStatus } from '../common/enums/ticket-status.enum';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import {
  TicketSingleResponseDto,
  TicketsPaginatedResponseDto,
} from './dto/ticket-envelope.response.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketsService } from './tickets.service';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new ticket (public)' })
  @ApiBody({ type: CreateTicketDto })
  @ApiCreatedResponse({ type: TicketSingleResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiInternalServerErrorResponse({ type: ErrorResponseDto })
  create(@Body() dto: CreateTicketDto): Promise<TicketSingleResponseDto> {
    return this.ticketsService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Agent, UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List tickets (agents and admins)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'priority', required: false, enum: TicketPriority })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Match title, description, or customer email (case-insensitive)',
  })
  @ApiOkResponse({ type: TicketsPaginatedResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiInternalServerErrorResponse({ type: ErrorResponseDto })
  findAll(
    @Query() query: QueryTicketsDto,
  ): Promise<TicketsPaginatedResponseDto> {
    return this.ticketsService.findPage(query);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Agent, UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ticket status (agents and admins)' })
  @ApiBody({ type: UpdateTicketDto })
  @ApiOkResponse({ type: TicketSingleResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiInternalServerErrorResponse({ type: ErrorResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
  ): Promise<TicketSingleResponseDto> {
    return this.ticketsService.updateStatus(id, dto);
  }
}
