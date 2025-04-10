import { IsString, IsOptional } from 'class-validator';

export class TruecallerCallbackDto {
  @IsString()
  requestId!: string;

  @IsString()
  @IsOptional() // accessToken might not be present in the first callback
  accessToken?: string;

  @IsString()
  @IsOptional() // endpoint might not be present in the first callback
  endpoint?: string;

  @IsString()
  @IsOptional() // status might be present in the first callback
  status?: string;
} 