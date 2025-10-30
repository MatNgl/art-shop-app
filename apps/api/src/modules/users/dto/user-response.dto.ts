import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

@Exclude()
export class UserResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: 'John' })
  @Expose()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @Expose()
  lastName: string;

  @ApiProperty({ example: '0612345678' })
  @Expose()
  phone: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  @Expose()
  role: UserRole;

  @ApiProperty({ example: true })
  @Expose()
  isActive: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ example: 'John Doe' })
  @Expose()
  fullName: string;
}
