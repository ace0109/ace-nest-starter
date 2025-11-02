import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsObject,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ description: 'Task name' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Task type',
    enum: ['cron', 'interval', 'timeout'],
  })
  @IsEnum(['cron', 'interval', 'timeout'])
  type: 'cron' | 'interval' | 'timeout';

  @ApiProperty({
    description: 'Cron pattern (required for cron tasks)',
    example: '*/30 * * * * *',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(
    /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
    {
      message: 'Invalid cron pattern',
    },
  )
  pattern?: string;

  @ApiProperty({
    description:
      'Delay in milliseconds (required for interval and timeout tasks)',
    example: 5000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  milliseconds?: number;

  @ApiProperty({
    description: 'Additional metadata',
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateCronJobDto {
  @ApiProperty({
    description: 'New cron pattern',
    example: '0 */5 * * * *',
  })
  @IsString()
  @Matches(
    /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
    {
      message: 'Invalid cron pattern',
    },
  )
  pattern: string;
}
