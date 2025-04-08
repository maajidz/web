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

// Interface for the expected Truecaller profile structure
// Adjust based on the actual data returned by their API
export interface TruecallerProfile {
  firstName?: string;
  lastName?: string;
  phoneNumbers?: string[];
  // Add other relevant fields like email, city, etc.
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
  // Add other fields if needed (e.g., first/last name)
  // user_first_name?: string;
  // user_last_name?: string;
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
  ) {}

  async verifyTruecallerUser(
    accessToken: string,
  ): Promise<{ success: boolean; userId?: string; access_token?: string; error?: string }> {
    try {
      // 1. Fetch profile from Truecaller
      this.logger.log(`Fetching Truecaller profile for token: ${accessToken.substring(0, 10)}...`);
      const truecallerProfile = await this.fetchTruecallerProfile(accessToken);

      if (!truecallerProfile) {
        return { success: false, error: 'FailedToFetchTruecallerProfile' };
      }

      // Extract primary phone number (assuming the first one is primary)
      let phoneNumber: string | number | undefined | null = truecallerProfile.phoneNumbers?.[0];
      let phoneNumberStr: string;

      // Add check to ensure phoneNumber is a string or a number
      if (typeof phoneNumber === 'number') {
        phoneNumberStr = String(phoneNumber);
      } else if (typeof phoneNumber === 'string' && phoneNumber.length > 0) {
        phoneNumberStr = phoneNumber;
      } else {
        // Handle cases where it's null, undefined, empty string, or other type
        this.logger.warn(
            `Phone number missing or invalid type in Truecaller profile. Value: ${phoneNumber}, Profile data: ${JSON.stringify(truecallerProfile)}`
        );
        return { success: false, error: 'TruecallerProfileMissingPhone' };
      }

       // Simple format check/cleanup (e.g., remove leading '+') - adjust as needed
       // Now safe to call startsWith on phoneNumberStr
       const formattedPhoneNumber = phoneNumberStr.startsWith('+') ? phoneNumberStr.substring(1) : phoneNumberStr;

      this.logger.log(`Truecaller profile fetched for phone: ${formattedPhoneNumber}`);

      // 2. Check if user exists in Supabase & Login/Create
      // Use the refactored method
      return this.validateAndLoginUser(
        formattedPhoneNumber,
        truecallerProfile.firstName,
        truecallerProfile.lastName
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
    this.logger.log(`Verifying Phone.email URL: ${userJsonUrl}`);

    // 1. Basic URL validation already done by DTO, but double check domain
    if (!userJsonUrl || !userJsonUrl.startsWith('https://user.phone.email/')) {
      this.logger.warn(`Invalid user_json_url received: ${userJsonUrl}`);
      return { success: false, error: 'InvalidPhoneEmailUrl' };
    }

    try {
      // 2. Fetch data from Phone.email JSON URL
      const phoneEmailData = await this.fetchPhoneEmailData(userJsonUrl);

      if (!phoneEmailData?.user_country_code || !phoneEmailData?.user_phone_number) {
         this.logger.warn(`Missing required fields in Phone.email payload: ${JSON.stringify(phoneEmailData)}`);
        return { success: false, error: 'PhoneEmailDataMissing' };
      }

      // 3. Format phone number (e.g., combine country code and number, remove plus)
      // Assuming user_phone_number does NOT include country code based on docs
      const formattedPhoneNumber = `${phoneEmailData.user_country_code}${phoneEmailData.user_phone_number}`.replace(/^\+/, '');
      this.logger.log(`Phone.email verified phone number: ${formattedPhoneNumber}`);

      // 4. Check/Create user in Supabase & Generate Token (reuse logic)
      return this.validateAndLoginUser(formattedPhoneNumber /*, optional first/last name if available */);

    } catch (error: any) {
       this.logger.error(
        `Error during Phone.email verification: ${error?.message || error}`,
         error instanceof AxiosError ? JSON.stringify(error?.response?.data) : error?.stack
       );
       if (error instanceof AxiosError) {
          // Handle specific errors from the GET request to Phone.email URL
           return { success: false, error: 'FailedToFetchPhoneEmailData' };
       }
       return { success: false, error: 'InternalServerError' };
    }
  }

  // --- Helper to Fetch Phone.email Data ---
  private async fetchPhoneEmailData(url: string): Promise<PhoneEmailPayload | null> {
     try {
      const response = await firstValueFrom(
        this.httpService
          .get<PhoneEmailPayload>(url)
          .pipe(
             map((res) => res.data),
             catchError((error: AxiosError) => {
               this.logger.error(`Axios error fetching Phone.email URL (${url}): ${error.response?.status} - ${error.message}`, error.stack);
               // Don't throw here, let the main handler catch and return specific error
               throw error;
             }),
           )
       );
      return response;
     } catch (error) {
       // Logged in catchError, rethrow to be handled by verifyPhoneEmail
       throw error;
     }
  }

  // --- Refactored User Validation & Login Logic ---
  private async validateAndLoginUser(
    phoneNumber: string,
    // Optionally pass first/last name if available from verification source
    firstName?: string | null,
    lastName?: string | null,
  ): Promise<{ success: boolean; userId?: string; access_token?: string; error?: string }> {
    this.logger.log(`Validating user for phone: ${phoneNumber}`);
      const supabase = this.supabaseService.supabaseAdmin;

    try {
      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('phone_number', phoneNumber)
        .maybeSingle();

      if (fetchError) {
        this.logger.error(`Supabase fetch error: ${fetchError.message}`, fetchError.stack);
        return { success: false, error: 'DatabaseFetchError' };
      }

      let userIdToReturn: string | undefined;
      if (existingUser) {
        // User exists - Login
        this.logger.log(`Existing user found: ${existingUser.id}`);
        userIdToReturn = existingUser.id;
        // Potential future logic: Update name if verification source provides it?
      } else {
        // User doesn't exist - Signup
        this.logger.log(`Creating new user profile for phone: ${phoneNumber}`);
        const { data: newUser, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            phone_number: phoneNumber,
            first_name: firstName || null,
            last_name: lastName || null,
            // Set other defaults if needed
          })
          .select('id')
          .single();

        if (insertError) {
          this.logger.error(`Supabase insert error: ${insertError.message}`, insertError.stack);
          return { success: false, error: 'DatabaseInsertError' };
        }

        this.logger.log(`New user created: ${newUser.id}`);
        userIdToReturn = newUser.id;
      }
      
      // Generate JWT
      if (userIdToReturn) {
          const payload = { sub: userIdToReturn };
          const generatedToken = await this.jwtService.signAsync(payload);
          this.logger.log(`JWT generated successfully for user: ${userIdToReturn}`);
          return { success: true, userId: userIdToReturn, access_token: generatedToken };
      } else {
          this.logger.error('User ID was not determined after validation/creation.');
          return { success: false, error: 'UserIdResolutionFailed' };
      }

    } catch (error: any) {
       this.logger.error(`Error during user validation/login for phone ${phoneNumber}: ${error?.message || error}`, error?.stack);
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