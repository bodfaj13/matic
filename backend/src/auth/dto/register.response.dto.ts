import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';

export class RegisterUserDataDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;
}

export class RegisterResponseDto {
  @ApiProperty({ example: 'Registered successfully' })
  message: string;

  @ApiProperty()
  status: boolean;

  @ApiProperty({ type: RegisterUserDataDto })
  data: RegisterUserDataDto;

  @ApiProperty({ example: '201' })
  statusCode: string;
}
