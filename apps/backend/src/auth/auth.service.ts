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
import axios, { AxiosError } from 'axios'; // Ensure AxiosError is imported
import { JwtService } from '@nestjs/jwt'; // Import JwtService
import { UserProfile, DbUserProfile } from './entities/user-profile.entity'; // Import both interfaces
import { TruecallerCallbackDto } from './dto/truecaller-callback.dto'; // Correct import
import { ConfigService } from '@nestjs/config'; // Import ConfigService
import { URLSearchParams } from 'url'; // Import URLSearchParams
import { UsersService } from '../users/users.service'; // +++ Add UsersService import

// Interface for the expected Truecaller profile structure
// Adjust based on the actual data returned by their API
export interface TruecallerProfile {
  firstName?: string;
  lastName?: string;
  phoneNumbers?: string[];
  // Add other relevant fields like email, city, etc.
}

// Interface for the expected Phone.email JSON structure
interface PhoneEmailPayload {
  user_country_code: string;
  user_phone_number: string;
  // Add other fields if needed (e.g., first/last name)
  // user_first_name?: string;
  // user_last_name?: string;
}

// Define the type for the second argument of validateAndLoginUser
interface UserValidationData {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  profilePictureUrl?: string | null; // Corrected field name
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService, // Inject ConfigService
    private readonly usersService: UsersService, // +++ Inject UsersService
  ) {}

  // Add a decodeToken method to help with debugging
  decodeToken(token: string): any {
    // This just decodes without verification, for debugging purposes
    return this.jwtService.decode(token);
  }

  async verifyTruecallerUser(data: TruecallerCallbackDto): Promise<{ userId: string; access_token: string }> {
    this.logger.log(`Fetching Truecaller profile for token: ${data.accessToken?.substring(0, 10)}...`);
    
    // Check if accessToken and endpoint are present
    if (!data.accessToken || !data.endpoint) {
        this.logger.error('Missing accessToken or endpoint in Truecaller callback data');
        throw new HttpException('Invalid Truecaller callback data', HttpStatus.BAD_REQUEST);
    }

    try {
      // Fetch profile from Truecaller API
      const response = await fetch(data.endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${data.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      this.logger.debug(`Truecaller API response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Truecaller API error (${response.status}): ${errorText}`);
        throw new Error(`Failed to fetch Truecaller profile: ${response.status} ${errorText}`);
      }
      
      const profileData = await response.json();
      this.logger.debug(`Raw Truecaller profile data: ${JSON.stringify(profileData)}`);
      
      // Extract and standardize phone number
      const phoneNumber = profileData.phoneNumbers?.[0]?.toString() || '';
      const standardizedPhone = phoneNumber.replace(/\D/g, '');
      this.logger.log(`Truecaller profile fetched & standardized for phone: ${standardizedPhone}`);
      
      if (!standardizedPhone) {
        this.logger.error('No phone number found in Truecaller profile');
        throw new Error('No phone number found in Truecaller profile');
      }
      
      // Validate user with standardized phone
      this.logger.log(`Validating user for phone: ${standardizedPhone}`);
      
      // Correctly pass the validation data as an object
      const validationData: UserValidationData = {
        firstName: profileData.name?.first || null,
        lastName: profileData.name?.last || null,
        email: profileData.onlineIdentities?.email || null,
        profilePictureUrl: null, // Truecaller doesn't provide profile picture
      };

      const result = await this.validateAndLoginUser(standardizedPhone, validationData);

      if (!result.success || !result.access_token || !result.userId) {
        this.logger.error(`Validation/Login failed for Truecaller user: ${result.error}`);
        throw new HttpException(result.error || 'Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      
      // Now access_token is guaranteed to be a string
      return { userId: result.userId, access_token: result.access_token };
    } catch (error: unknown) { // Catch unknown errors
      let errorMessage = 'Unknown error in verifyTruecallerUser';
      let errorStack: string | undefined = undefined;
      if (error instanceof Error) {
        errorMessage = error.message;
        errorStack = error.stack;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      this.logger.error(errorMessage, errorStack);
      // Re-throw HttpException or a generic error
      if (error instanceof HttpException) throw error;
      throw new HttpException('Internal server error during Truecaller verification', HttpStatus.INTERNAL_SERVER_ERROR);
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
      // Pass empty object for validation data as Phone.email doesn't provide it here
      return this.validateAndLoginUser(formattedPhoneNumber, {}); 

    } catch (error: unknown) { // Catch unknown errors
       let errorMessage = 'Unknown error during Phone.email verification';
       let errorStack: string | undefined = undefined;
       let responseData: any = undefined;
       if (error instanceof AxiosError) {
          errorMessage = `FailedToFetchPhoneEmailData: ${error.message}`;
          responseData = error.response?.data;
          errorStack = error.stack;
       } else if (error instanceof Error) {
          errorMessage = error.message;
          errorStack = error.stack;
       } else if (typeof error === 'string') {
          errorMessage = error;
       }

       this.logger.error(errorMessage, responseData ? JSON.stringify(responseData) : errorStack);

       if (error instanceof AxiosError) {
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
    validationData: UserValidationData, // Use the defined type
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
        // Re-enabled profile update with correct column name
        if (validationData.firstName || validationData.lastName || validationData.email || validationData.profilePictureUrl) {
          this.logger.log(`Updating profile data for existing user: ${existingUser.id}`);
          const updateData: any = {};
          
          // Only include fields that are provided from validationData
          if (validationData.firstName) updateData.first_name = validationData.firstName;
          if (validationData.lastName) updateData.last_name = validationData.lastName;
          if (validationData.email) updateData.email = validationData.email;
          if (validationData.profilePictureUrl) updateData.profile_picture_url = validationData.profilePictureUrl;
          
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
            first_name: validationData.firstName || null, 
            last_name: validationData.lastName || null,  
            email: validationData.email || null,         
            profile_picture_url: validationData.profilePictureUrl || null 
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

    } catch (error: unknown) { // Catch unknown errors
      let errorMessage = 'Unknown error during user validation/login';
      let errorStack: string | undefined = undefined;
      if (error instanceof Error) {
        errorMessage = error.message;
        errorStack = error.stack;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      this.logger.error(`Unexpected error during user validation/login for phone ${phoneNumber}: ${errorMessage}`, errorStack);
      return { success: false, error: 'InternalServerError' };
    }
  }

  // --- Original Truecaller Fetch Helper --- was commented out

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

  // +++ IMPLEMENTING LINKEDIN METHOD +++
  async exchangeLinkedInCode(
    code: string,
    codeVerifier: string,
  ): Promise<{ success: boolean; userId?: string; access_token?: string; error?: string }> {
    this.logger.log(`[LinkedIn] Exchanging code for token. Code starts: ${code?.substring(0, 10)}...`);

    const clientId = this.configService.get<string>('LINKEDIN_CLIENT_ID');
    const clientSecret = this.configService.get<string>('LINKEDIN_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('LINKEDIN_REDIRECT_URI');
    const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
    const userInfoUrl = 'https://api.linkedin.com/v2/userinfo'; // +++ UserInfo endpoint

    if (!clientId || !clientSecret || !redirectUri) {
        this.logger.error('[LinkedIn] Missing required environment variables (ID, SECRET, or REDIRECT_URI)');
        return { success: false, error: 'LinkedInConfigMissing' };
    }

    const maskedSecret = clientSecret ? `${clientSecret.substring(0, 3)}...${clientSecret.substring(clientSecret.length - 3)}` : 'SECRET_MISSING';
    this.logger.debug(`[LinkedIn] Attempting token exchange with ClientID: ${clientId}, Masked Secret: ${maskedSecret}, Redirect URI: ${redirectUri}`);

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    // OIDC spec might not require code_verifier for token exchange, but including if needed by LinkedIn
    // params.append('code_verifier', codeVerifier); 

    let linkedinAccessToken: string; // Define variable to hold the token

    try {
      // --- Using direct axios call instead of HttpService ---
      const response = await axios.post(tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      const tokenResponse = response.data; // Axios puts data directly in response.data
      // --- End direct axios call ---

      linkedinAccessToken = tokenResponse.access_token; // Assign token
      // const linkedinIdToken = tokenResponse.id_token; // ID token also available if needed

      if (!linkedinAccessToken) {
          this.logger.error('[LinkedIn] No access_token received from LinkedIn.');
          return { success: false, error: 'LinkedInTokenMissing' };
      }

      this.logger.log(`[LinkedIn] Access token received: ${linkedinAccessToken.substring(0, 10)}...`);

      // +++ Fetch User Info from LinkedIn +++
      const userInfoResponse = await axios.get(userInfoUrl, {
        headers: {
          Authorization: `Bearer ${linkedinAccessToken}`,
        },
      });

      const linkedInUserInfo = userInfoResponse.data;
      this.logger.log(`[LinkedIn] UserInfo received: ${JSON.stringify(linkedInUserInfo)}`);

      const linkedinUserId = linkedInUserInfo.sub; // OpenID Connect standard subject identifier
      const email = linkedInUserInfo.email;
      const firstName = linkedInUserInfo.given_name;
      const lastName = linkedInUserInfo.family_name;
      const pictureUrl = linkedInUserInfo.picture;
      const emailVerified = linkedInUserInfo.email_verified; // boolean

      if (!linkedinUserId || !email) {
         this.logger.error('[LinkedIn] Missing required user info (sub or email) from /userinfo endpoint.');
         return { success: false, error: 'LinkedInUserInfoIncomplete' };
      }

      // +++ Find or Create User in our DB +++
      // Assuming a method exists in UsersService like findOrCreateUserByProvider
      const user = await this.usersService.findOrCreateUserByProvider(
          'linkedin',
          linkedinUserId,
          {
              email,
              firstName,
              lastName,
              profilePictureUrl: pictureUrl,
              emailVerified, // Pass verification status
          }
      );

      if (!user) {
          this.logger.error(`[LinkedIn] Failed to find or create user with LinkedIn ID: ${linkedinUserId}`);
          return { success: false, error: 'UserCreationFailed' };
      }

      this.logger.log(`[LinkedIn] User found/created in DB: ID ${user.id}`);

      // +++ Generate JWT for the user +++
      const payload = { sub: user.id, email: user.email }; // Use our internal user ID for JWT subject
      const jwtToken = await this.jwtService.signAsync(payload);

      this.logger.log(`[LinkedIn] JWT generated successfully for user ${user.id}`);

      return { success: true, userId: user.id, access_token: jwtToken };
      // --- End User Info Fetching & User Creation ---

    } catch (error) { // Keep catch (error), but check type inside
        // Handle Axios error structure
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let errorDetails = 'Unknown error during LinkedIn flow'; // Modified default message
        let loggedStack: string | undefined = undefined;

        if (axios.isAxiosError(error)) { // Use type guard
            status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
            // Distinguish between token exchange failure and userinfo failure
            const failedUrl = error.config?.url;
            const failurePoint = failedUrl === tokenUrl ? 'token exchange' : (failedUrl === userInfoUrl ? 'user info fetch' : 'request');
            
            errorDetails = JSON.stringify(error.response?.data) || error.message;
            loggedStack = error.stack;
            this.logger.error(`[LinkedIn] Axios Error during ${failurePoint}: ${status} - ${errorDetails}`, loggedStack);
        } else if (error instanceof Error) { // Handle generic Error
            errorDetails = error.message;
            loggedStack = error.stack;
            this.logger.error(`[LinkedIn] Non-Axios Error during LinkedIn flow: ${errorDetails}`, loggedStack);
        } else { // Handle other unknown throws
            errorDetails = String(error);
            this.logger.error(`[LinkedIn] Unknown error type during LinkedIn flow: ${errorDetails}`);
        }
       
       // Return specific error if possible, otherwise generic
       // Let the specific error codes from above handle specific failures like LinkedInTokenMissing
       const returnErrorMsg = status !== HttpStatus.INTERNAL_SERVER_ERROR && axios.isAxiosError(error)
         ? `LinkedInRequestFailed - Status ${status}`
         : 'InternalServerError';
       return { success: false, error: returnErrorMsg };
    }
  }
  // +++ END LINKEDIN METHOD +++
} 