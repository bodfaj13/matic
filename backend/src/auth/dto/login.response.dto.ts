import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';

export class LoginUserSummaryDto {
  @ApiProperty()
  email: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;
}

export class LoginPayloadDataDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty({ type: LoginUserSummaryDto })
  user: LoginUserSummaryDto;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'Login successful' })
  message: string;

  @ApiProperty()
  status: boolean;

  @ApiProperty({ type: LoginPayloadDataDto })
  data: LoginPayloadDataDto;

  @ApiProperty({ example: '200' })
  statusCode: string;
}
