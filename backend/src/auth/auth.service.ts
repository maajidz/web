import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SupabaseService } from '../supabase/supabase.service'; // Adjust path if needed
import { firstValueFrom, map, catchError } from 'rxjs';
import { AxiosError } from 'axios';
import { JwtService } from '@nestjs/jwt'; // Import JwtService
import { ConfigService } from '@nestjs/config';

// Interface for the expected Truecaller profile structure
// Adjust based on the actual data returned by their API
export interface TruecallerProfile {
  id?: string;
  userId?: number;
  phoneNumbers?: number[]; // Or string[]? Verify based on log
  name?: {
    first?: string;
    last?: string;
  };
  addresses?: { countryCode?: string }[];
  onlineIdentities?: {
    email?: string;
  };
  avatarUrl?: string;
  // Add other fields if needed
}

// Interface for the user profile in your Supabase table
// Ensure this matches your 'user_profiles' schema
interface UserProfile {
  id: string; // Assuming UUID or similar string ID
  phone_number: string; // Assuming text/varchar
  first_name?: string | null; // Assuming text/varchar, nullable
  last_name?: string | null; // Assuming text/varchar, nullable
  email?: string | null; // Assuming text/varchar, nullable
  profile_type?: string | null; // Assuming text/varchar or enum, nullable
  bio?: string | null; // Assuming text, nullable
  profile_pic_url?: string | null; // Assuming text/varchar, nullable
  created_at: string; // Assuming timestamp string
  updated_at?: string | null; // Assuming timestamp string, nullable
}

// Interface for the expected Phone.email JSON structure
interface PhoneEmailPayload {
  user_country_code: string;
  user_phone_number: string;
  // Add potentially available fields based on observation
  user_first_name?: string;
  user_last_name?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly TRUECALLER_PROFILE_URL =
    'https://profile4.truecaller.com/v1/default';

  constructor(
    private readonly httpService: HttpService,
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async verifyTruecallerUser(
    accessToken: string,
  ): Promise<{ success: boolean; userId?: string; access_token?: string; error?: string }> {
    this.logger.log(`Fetching Truecaller profile for token: ${accessToken.substring(0, 10)}...`);
    const profileUrl = 'https://profile4.truecaller.com/v1/default'; // Use appropriate endpoint if needed

    try {
      const response = await firstValueFrom(
        this.httpService.get<TruecallerProfile>(profileUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );

      const truecallerProfile = response.data;
      // Log the full profile at debug level
      this.logger.debug(`Fetched Truecaller Profile: ${JSON.stringify(truecallerProfile)}`);


      if (!truecallerProfile?.phoneNumbers || truecallerProfile.phoneNumbers.length === 0) {
        this.logger.error('Truecaller profile response missing phone number');
        return { success: false, error: 'TruecallerProfileMissingPhone' };
      }

      // Convert phone number to string if it's a number
      const phoneNumberStr = String(truecallerProfile.phoneNumbers[0]);
      // Standardize phone number: Remove non-digits (like +)
      const standardizedPhoneNumber = phoneNumberStr.replace(/\D/g, '');

      this.logger.log(`Truecaller profile fetched & standardized for phone: ${standardizedPhoneNumber}`);

      // Extract potential extra fields
      const firstName = truecallerProfile.name?.first;
      const lastName = truecallerProfile.name?.last;
      const email = truecallerProfile.onlineIdentities?.email;
      const avatarUrl = truecallerProfile.avatarUrl; // Assuming this is the field name

      // Call validateAndLoginUser with extracted data
      return this.validateAndLoginUser(
        standardizedPhoneNumber,
        firstName,
        lastName,
        email, // Pass email
        avatarUrl // Pass avatarUrl (to be saved as profile_pic_url)
      );

    } catch (error: any) {
      this.logger.error(
        `Error during Truecaller verification process: ${error?.message || error}`,
        error?.stack,
      );
      // Check if it's an Axios error from Truecaller API call
      if (error instanceof AxiosError) {
        this.logger.error(
          `Axios Error Status: ${error?.response?.status}, Data: ${
            JSON.stringify(error?.response?.data)
          }`,
        );
        if (error?.response?.status === 401) {
          this.logger.error(`Invalid Truecaller access token used.`);
          return { success: false, error: 'InvalidTruecallerToken' };
        }
        return { success: false, error: 'TruecallerApiError' };
      }
      return { success: false, error: 'InternalServerError' };
    }
  }

  // --- New Method for Phone.email Verification ---
  async verifyPhoneEmail(
    userJsonUrl: string
  ): Promise<{ success: boolean; userId?: string; access_token?: string; error?: string }> {
    this.logger.log(`Fetching Phone.email payload from URL starting with: ${userJsonUrl.substring(0, 30)}...`);

    if (!userJsonUrl.startsWith('https://prod-phoneemail-eu.s3.eu-west-1.amazonaws.com/')) {
        this.logger.error(`Invalid user_json_url prefix: ${userJsonUrl}`);
        return { success: false, error: 'InvalidPayloadUrl' };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<PhoneEmailPayload>(userJsonUrl)
      );
      const phoneEmailData = response.data;
      this.logger.debug(`Fetched Phone.email Payload: ${JSON.stringify(phoneEmailData)}`);


      if (!phoneEmailData.user_phone_number || !phoneEmailData.user_country_code) {
          this.logger.error('Phone.email payload missing phone number or country code');
          return { success: false, error: 'PayloadMissingPhoneInfo' };
      }

      // Standardize phone number (remove leading + if present, ensure only digits)
      const formattedPhoneNumber = `${phoneEmailData.user_country_code}${phoneEmailData.user_phone_number}`.replace(/\D/g, '');

      this.logger.log(`Phone.email payload processed for phone: ${formattedPhoneNumber}`);

      // Pass optional name fields
      const firstName = phoneEmailData.user_first_name;
      const lastName = phoneEmailData.user_last_name;

      // Call validateAndLoginUser
      return this.validateAndLoginUser(
        formattedPhoneNumber,
        firstName,
        lastName
        // Email/Avatar not typically provided by Phone.email payload AFAIK
      );

    } catch (error: any) {
       this.logger.error(
        `Error during Phone.email verification: ${error?.message || error}`,
         error instanceof AxiosError ? JSON.stringify(error?.response?.data) : error?.stack
       );
       if (error instanceof AxiosError) {
          // Handle specific errors from the GET request to Phone.email URL
           return { success: false, error: 'FailedToFetchPayload' };
       }
       return { success: false, error: 'InternalServerError' };
    }
  }

  // --- Refactored User Validation & Login Logic ---
  private async validateAndLoginUser(
    phoneNumber: string,
    firstName?: string | null,
    lastName?: string | null,
    email?: string | null, // Add email parameter
    profilePicUrl?: string | null, // Add profilePicUrl parameter
  ): Promise<{ success: boolean; userId?: string; access_token?: string; error?: string }> {
    this.logger.log(`Validating user for phone: ${phoneNumber}`);
    const supabase = this.supabaseService.supabaseAdmin;

    try {
      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, email, profile_pic_url') // Select fields to check/update
        .eq('phone_number', phoneNumber)
        .maybeSingle();

      if (fetchError) {
        this.logger.error(`Supabase error fetching user by phone: ${fetchError.message}`, fetchError.stack);
        return { success: false, error: 'DatabaseFetchError' };
      }

      let userIdToReturn: string | undefined;
      let needsUpdate = false;
      const updates: Partial<UserProfile> = {}; // Define updates object

      if (existingUser) {
        // --- User exists - Login & Potential Update ---
        this.logger.log(`Existing user found: ${existingUser.id}`);
        userIdToReturn = existingUser.id;

        // Check if we got potentially new/updated info from the login provider
        if (firstName && !existingUser.first_name) {
           updates.first_name = firstName; needsUpdate = true;
        }
        if (lastName && !existingUser.last_name) {
           updates.last_name = lastName; needsUpdate = true;
        }
        if (email && !existingUser.email) {
           updates.email = email; needsUpdate = true;
        }
        if (profilePicUrl && !existingUser.profile_pic_url) {
           updates.profile_pic_url = profilePicUrl; needsUpdate = true;
        }

        if (needsUpdate) {
          this.logger.log(`Updating existing user profile (${userIdToReturn}) with new details.`);
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', userIdToReturn);

          if (updateError) {
            this.logger.error(`Supabase error updating profile: ${updateError.message}`, updateError.stack);
            // Log error but proceed with login - update isn't critical path
          } else {
             this.logger.log(`Profile updated successfully for user: ${userIdToReturn}`);
          }
        }

      } else {
        // --- User doesn't exist - Signup ---
        this.logger.log(`Creating new user profile for phone: ${phoneNumber}`);
        const { data: newUser, error: insertError } = await supabase
          .from('user_profiles')
          .insert({ // Include all fields
            phone_number: phoneNumber,
            first_name: firstName || null,
            last_name: lastName || null,
            email: email || null,
            profile_pic_url: profilePicUrl || null,
          })
          .select('id')
          .single(); // Expects insert to return the new row

        if (insertError) {
          this.logger.error(`Supabase error inserting new user: ${insertError.message}`, insertError.stack);
          return { success: false, error: 'DatabaseInsertError' };
        }
        if (!newUser) {
             this.logger.error('Supabase insert succeeded but returned no data.');
             return { success: false, error: 'DatabaseInsertError' };
        }

        this.logger.log(`New user created: ${newUser.id}`);
        userIdToReturn = newUser.id;
      }

      // --- Generate JWT ---
      if (userIdToReturn) {
        const payload = { sub: userIdToReturn }; // 'sub' is standard JWT claim for subject (user ID)
        const generatedToken = await this.jwtService.signAsync(payload, {
             secret: this.configService.get<string>('JWT_SECRET'),
             expiresIn: this.configService.get<string>('JWT_EXPIRATION_TIME') || '7d',
         });
        this.logger.log(`JWT generated successfully for user: ${userIdToReturn}`);
        return { success: true, userId: userIdToReturn, access_token: generatedToken };
      } else {
        // This case should ideally not be reached if logic above is correct
        this.logger.error('User ID was undefined after validation/creation flow.');
        return { success: false, error: 'UserValidationFailed' };
      }
    } catch (error: any) {
      this.logger.error(`Unexpected error during user validation/login: ${error?.message || error}`, error?.stack);
      return { success: false, error: 'InternalServerError' };
    }
  }

  // --- Original Truecaller Fetch Helper ---
  private async fetchTruecallerProfile(
    accessToken: string,
  ): Promise<TruecallerProfile | null> {
    try {
      const response = await firstValueFrom(
        this.httpService
          .get<TruecallerProfile>(this.TRUECALLER_PROFILE_URL, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })
          .pipe(map((res: { data: TruecallerProfile }) => res.data)),
      );
      return response;
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch Truecaller profile: ${error?.message || error}`,
        error instanceof AxiosError ? error?.response?.data : error?.stack,
      );
      // Rethrow to be caught by the main handler, preserving specific errors if needed
      throw error;
    }
  }

  // --- Get Profile Method (Added back for /profile endpoint) ---
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    this.logger.log(`Fetching profile for user ID: ${userId}`);
    const supabase = this.supabaseService.supabaseAdmin;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*') // Select all profile fields
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Code for "No rows found"
          this.logger.warn(`No profile found for user ID: ${userId}`);
          return null; // Or throw NotFoundException if preferred
        } else {
          this.logger.error(`Supabase error fetching profile: ${error.message}`, error.stack);
          throw new HttpException('Failed to fetch profile', HttpStatus.INTERNAL_SERVER_ERROR);
        }
      }

      if (!data) {
           this.logger.warn(`Profile data is null for user ID: ${userId}, despite no error.`);
           return null; // Should ideally not happen if error handling is correct
      }
      
      this.logger.log(`Profile fetched successfully for user ID: ${userId}`);
      return data as UserProfile;
    } catch (error: unknown) { // Explicitly type error as unknown
      if (error instanceof HttpException) throw error; // Re-throw known HTTP exceptions

      // Check if it's an Error instance before accessing properties
      let errorMessage = 'Unknown error';
      let errorStack: string | undefined = undefined;
      if (error instanceof Error) {
        errorMessage = error.message;
        errorStack = error.stack;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      this.logger.error(`Unexpected error fetching profile for user ${userId}: ${errorMessage}`, errorStack);
      throw new HttpException('An unexpected error occurred', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 