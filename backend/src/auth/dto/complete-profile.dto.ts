import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CompleteProfileDto {
  @IsString()
  @IsNotEmpty()
  fullName: string = '';

  @IsOptional()
  @IsUrl({}, { message: 'Profile picture must be a valid URL' }) // Ensure it's a URL if provided
  @IsString()
  profilePictureUrl?: string;
}
