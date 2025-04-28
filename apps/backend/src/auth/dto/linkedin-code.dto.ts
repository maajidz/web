import { IsNotEmpty, IsString } from 'class-validator';

export class LinkedInCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string = '';

  @IsString()
  @IsNotEmpty()
  codeVerifier: string = '';
} 