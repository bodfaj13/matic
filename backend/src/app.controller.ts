import { Controller, Get } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from './common/dto/error-response.dto';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check endpoint' })
  @ApiOkResponse({
    schema: { type: 'string', example: 'Hello World!' },
  })
  @ApiInternalServerErrorResponse({ type: ErrorResponseDto })
  getHello(): string {
    return this.appService.getHello();
  }
}
