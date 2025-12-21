import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FirebirdConfigDto {
  @ApiProperty({ example: 'localhost' })
  @IsString()
  host: string;

  @ApiPropertyOptional({ example: 3050, default: 3050 })
  @IsOptional()
  @IsInt()
  port?: number;

  @ApiProperty({ example: '/path/to/database.fdb' })
  @IsString()
  database: string;

  @ApiPropertyOptional({ example: 'SYSDBA' })
  @IsOptional()
  @IsString()
  user?: string;

  @ApiPropertyOptional({ example: 'masterkey' })
  @IsOptional()
  @IsString()
  password?: string;
}
