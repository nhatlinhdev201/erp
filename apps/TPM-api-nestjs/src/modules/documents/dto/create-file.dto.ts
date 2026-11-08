import { IsString, IsInt, IsEnum, IsOptional, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum FileCategoryEnum {
  POA = 'POA',
  POP = 'POP',
  INVOICE = 'INVOICE',
  CONTRACT = 'CONTRACT',
  REPORT = 'REPORT',
  OTHER = 'OTHER',
}

export class CreateFileDto {
  @ApiProperty({ example: 'report-q2-2024.pdf', description: 'File name (stored name)' })
  @IsString()
  @MaxLength(500)
  filename: string;

  @ApiProperty({ example: 'Q2 2024 Promotion Report.pdf', description: 'Original file name' })
  @IsString()
  @MaxLength(500)
  originalName: string;

  @ApiProperty({ example: 'application/pdf', description: 'MIME type of the file' })
  @IsString()
  @MaxLength(100)
  mimeType: string;

  @ApiProperty({ example: 204800, description: 'File size in bytes' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size: number;

  @ApiProperty({ example: 'uploads/2024/report-q2-2024.pdf', description: 'S3 object key' })
  @IsString()
  @MaxLength(1000)
  s3Key: string;

  @ApiProperty({ example: 'lerp-files-tpm', description: 'S3 bucket name' })
  @IsString()
  @MaxLength(200)
  s3Bucket: string;

  @ApiPropertyOptional({ enum: FileCategoryEnum, description: 'File category' })
  @IsOptional()
  @IsEnum(FileCategoryEnum)
  category?: FileCategoryEnum;
}
