import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SupabaseService } from '../supabase/supabase.service'; // Adjust path if needed
import { firstValueFrom, map, catchError } from 'rxjs';
import axios, { AxiosError } from 'axios';
import { JwtService } from '@nestjs/jwt'; // Import JwtService
import { UserProfile } from './entities/user-profile.entity'; // Make sure you have this type/interface

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
interface DbUserProfile {
  id: string; // Assuming UUID or similar string ID
  phone_number: string; // Assuming text/varchar
  first_name?: string | null; // Assuming text/varchar, nullable
  last_name?: string | null; // Assuming text/varchar, nullable
  email?: string | null; // Assuming text/varchar, nullable
  profile_type?: string | null; // Assuming text/varchar or enum, nullable
  bio?: string | null; // Assuming text, nullable
  profile_picture_url?: string | null; // Assuming text/varchar, nullable
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

  constructor(
    private readonly httpService: HttpService,
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async verifyTruecallerUser(
    accessToken: string,
  ): Promise<{ success: boolean; userId?: string; access_token?: string; error?: string }> {
    this.logger.log(`Fetching Truecaller profile for token: ${accessToken.substring(0, 10)}...`);
    try {
      // Fetch Truecaller profile
      const response = await this.httpService.axiosRef.get<{
          phoneNumbers: string[];
          name?: { first?: string; last?: string };
          onlineIdentities?: { email?: string };
          avatarUrl?: string;
          // Add other fields you might need from the Truecaller profile response
        }>(
        // Ensure you are using the correct profile endpoint provided in the callback if available,
        // otherwise use the default one from config/docs if needed.
        // For simplicity, using a placeholder URL here - REPLACE if needed.
        'https://profile4-noneu.truecaller.com/v1/default',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      const truecallerProfile = response.data;
      this.logger.debug(`Raw Truecaller profile data: ${JSON.stringify(truecallerProfile)}`); // Added debug log

      if (!truecallerProfile?.phoneNumbers?.[0]) {
        this.logger.warn('Truecaller profile response missing phone number.');
        return { success: false, error: 'TruecallerProfileMissingPhone' };
      }

      // Convert the phone number to a string first before using string methods
      const phoneNumberStr = String(truecallerProfile.phoneNumbers[0]);
      // Standardize phone number: Remove non-digits (like +)
      const standardizedPhoneNumber = phoneNumberStr.replace(/\D/g, '');

      this.logger.log(`Truecaller profile fetched & standardized for phone: ${standardizedPhoneNumber}`);

      // ---- Extract additional profile data ----
      const firstName = truecallerProfile.name?.first;
      const lastName = truecallerProfile.name?.last;
      const email = truecallerProfile.onlineIdentities?.email;
      const avatarUrl = truecallerProfile.avatarUrl;
      // ---- End extraction ----

      // Validate and login/signup user, passing the extra data
      return await this.validateAndLoginUser(
          standardizedPhoneNumber,
          firstName, // Pass first name
          lastName,  // Pass last name
          email,     // Pass email
          avatarUrl  // Pass avatar URL
      );

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorData = error.response?.data;
        this.logger.error(`Failed to fetch Truecaller profile: Request failed with status code ${status}`, error.stack);
        if (errorData) {
            this.logger.error(JSON.stringify(errorData));
        }
        this.logger.error(`Axios Error Status: ${status}, Data: ${JSON.stringify(errorData)}`);
        return { success: false, error: status === 401 ? 'InvalidTruecallerToken' : 'TruecallerApiError' };
      } else {
        this.logger.error(`Error during Truecaller verification process: ${error?.message || error}`, error.stack);
        return { success: false, error: 'InternalServerError' };
      }
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
    // ---- Add optional parameters for extra data ----
    firstName?: string | null,
    lastName?: string | null,
    email?: string | null,
    avatarUrl?: string | null
    // ---- End added parameters ----
  ): Promise<{ success: boolean; userId?: string; access_token?: string; error?: string }> {
    this.logger.log(`Validating user for phone: ${phoneNumber}`);
    const supabase = this.supabaseService.supabaseAdmin;

    try {
      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('user_profiles')
        .select('id') // Select only needed fields for check
        .eq('phone_number', phoneNumber)
        .maybeSingle(); // Allows 0 or 1 row

      if (fetchError) {
        this.logger.error(`Supabase error fetching user by phone: ${fetchError.message}`, fetchError.stack);
        return { success: false, error: 'DatabaseFetchError' };
      }

      let userIdToReturn: string | undefined;
      if (existingUser) {
        // User exists - Login
        this.logger.log(`Existing user found: ${existingUser.id} for phone ${phoneNumber}`);
        userIdToReturn = existingUser.id;
        // Update existing user's profile data if provided
        if (firstName || lastName || email || avatarUrl) {
          this.logger.log(`Updating profile data for existing user: ${existingUser.id}`);
          const updateData: any = {};
          
          // Only include fields that are provided
          if (firstName) updateData.first_name = firstName;
          if (lastName) updateData.last_name = lastName;
          if (email) updateData.email = email;
          if (avatarUrl) updateData.profile_picture_url = avatarUrl;
          
          // Update the user profile
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update(updateData)
            .eq('id', existingUser.id);
            
          if (updateError) {
            this.logger.warn(`Could not update profile for user ${existingUser.id}: ${updateError.message}`);
            // Continue with login even if update fails
          } else {
            this.logger.log(`Profile updated successfully for user: ${existingUser.id}`);
          }
        }

      } else {
        // User doesn't exist - Signup
        this.logger.log(`Creating new user profile for phone: ${phoneNumber}`);
        const { data: newUser, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            phone_number: phoneNumber,
            // ---- Use the provided data ----
            first_name: firstName || null, // Use provided or null
            last_name: lastName || null,  // Use provided or null
            email: email || null,         // Use provided or null
            profile_picture_url: avatarUrl || null // Assuming your column is named this
            // ---- End using provided data ----
          })
          .select('id') // Select the ID of the newly inserted row
          .single(); // Expects insert to return the new row

        if (insertError) {
          this.logger.error(`Supabase error inserting new user: ${insertError.message}`, insertError.stack);
          return { success: false, error: 'DatabaseInsertError' };
        }

        if (!newUser || !newUser.id) {
             this.logger.error('Supabase insert operation did not return the new user ID.');
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
        // Should not happen if logic above is correct, but handle defensively
         this.logger.error('User ID was unexpectedly undefined before JWT generation.');
         return { success: false, error: 'UserCreationFailed' };
      }

    } catch (error: any) {
      this.logger.error(`Unexpected error during user validation/login for phone ${phoneNumber}: ${error?.message || error}`, error.stack);
      return { success: false, error: 'InternalServerError' };
    }
  }

  // --- Original Truecaller Fetch Helper ---
  // private async fetchTruecallerProfile(
  //   accessToken: string,
  // ): Promise<TruecallerProfile | null> {
  //   try {
  //     const response = await firstValueFrom(
  //       this.httpService
  //         .get<TruecallerProfile>(this.fetchPhoneEmailData, {
  //           headers: {
  //             Authorization: `Bearer ${accessToken}`,
  //           },
  //         })
  //         .pipe(map((res: { data: TruecallerProfile }) => res.data)),
  //     );
  //     return response;
  //   } catch (error: any) {
  //     this.logger.error(
  //       `Failed to fetch Truecaller profile: ${error?.message || error}`,
  //       error instanceof AxiosError ? error?.response?.data : error?.stack,
  //     );
  //     // Rethrow to be caught by the main handler, preserving specific errors if needed
  //     throw error;
  //   }
  // }

  // --- Get Profile Method (Added back for /profile endpoint) ---
  async getUserProfile(userId: string): Promise<DbUserProfile | null> {
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
      return data as DbUserProfile;
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

  // +++ NEW Method to Update User Profile +++
  async updateUserProfile(
      userId: string,
      firstName: string,
      lastName: string | null,
      profilePictureUrl?: string | null
  ): Promise<DbUserProfile> { // Return updated profile
      this.logger.log(`Updating profile for user ID: ${userId}`);
      const supabase = this.supabaseService.supabaseAdmin;

      const updateData: Partial<DbUserProfile> = {
          first_name: firstName,
          last_name: lastName,
          // Only include profile picture if provided
          ...(profilePictureUrl && { profile_picture_url: profilePictureUrl }),
          // We can also force updated_at if desired, but Supabase might handle it
      };

      try {
          const { data, error } = await supabase
              .from('user_profiles')
              .update(updateData)
              .eq('id', userId)
              .select() // Select the updated row
              .single(); // Expect one row to be updated

          if (error) {
              if (error.code === 'PGRST116') { // Should not happen if user exists but handle defensively
                  this.logger.error(`Failed to update: No profile found for user ID: ${userId} during update.`, error.stack);
                   throw new NotFoundException(`Profile not found for user ID ${userId}`);
              } else {
                  this.logger.error(`Supabase error updating profile for user ${userId}: ${error.message}`, error.stack);
                  throw new HttpException('Failed to update profile', HttpStatus.INTERNAL_SERVER_ERROR);
              }
          }

           if (!data) {
              this.logger.error(`Supabase update operation did not return data for user ID: ${userId}.`);
              throw new HttpException('Failed to confirm profile update', HttpStatus.INTERNAL_SERVER_ERROR);
           }

          this.logger.log(`Profile updated successfully for user ID: ${userId}`);
          return data as DbUserProfile; // Return the updated profile data
      } catch (error: unknown) {
          if (error instanceof HttpException) throw error; // Re-throw known HTTP exceptions

          let errorMessage = 'Unknown error during profile update';
          if (error instanceof Error) {
              errorMessage = error.message;
          } else if (typeof error === 'string') {
              errorMessage = error;
          }
           this.logger.error(`Unexpected error updating profile for user ${userId}: ${errorMessage}`, error instanceof Error ? error.stack : 'Unknown stack');
           throw new HttpException('An unexpected error occurred during profile update', HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }
  // +++ End NEW Method +++
} 