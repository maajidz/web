import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class PhoneEmailVerifyDto {
  @IsNotEmpty()
  @IsString()
  @IsUrl({
    protocols: ['https'], // Ensure it's an HTTPS URL
    require_protocol: true,
    host_whitelist: ['user.phone.email'] // Allow only the expected domain
  })
  user_json_url!: string; // Added definite assignment assertion
} 