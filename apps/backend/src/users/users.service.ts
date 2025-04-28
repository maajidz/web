import { Injectable, Logger, InternalServerErrorException, NotFoundException, HttpException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { DbUserProfile } from '../auth/entities/user-profile.entity'; // Corrected path

// Interface for the data expected from the provider
interface ProviderUserData {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    profilePictureUrl?: string | null;
    emailVerified?: boolean;
}

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(private readonly supabaseService: SupabaseService) {}

    /**
     * Finds a user by their identity provider details or creates a new user
     * profile and identity if they don't exist.
     * @param provider - The name of the identity provider (e.g., 'linkedin', 'google')
     * @param providerUserId - The user's unique ID from the provider
     * @param userData - User details obtained from the provider
     * @returns The found or newly created DbUserProfile
     */
    async findOrCreateUserByProvider(
        provider: string,
        providerUserId: string,
        userData: ProviderUserData
    ): Promise<DbUserProfile | null> {
        this.logger.log(`Finding or creating user for provider: ${provider}, providerUserId: ${providerUserId.substring(0, 5)}..., email: ${userData.email}`);

        const supabase = this.supabaseService.supabaseAdmin;
        const { email, firstName, lastName, profilePictureUrl } = userData;

        if (!email) {
            this.logger.error(`Cannot find or create user without an email for provider ${provider}`);
            return null; // Email is essential for lookup/creation in this model
        }

        try {
            // 1. Check if user exists by email
            const { data: existingUser, error: fetchError } = await supabase
                .from('user_profiles')
                .select('*') // Select all fields to return the full profile
                .eq('email', email)
                .maybeSingle();

            if (fetchError) {
                this.logger.error(`Supabase error fetching user by email (${email}): ${fetchError.message}`, fetchError.stack);
                throw new InternalServerErrorException('Database error checking for user.');
            }

            if (existingUser) {
                // 2a. User found by email - treat as login, potentially update profile
                this.logger.log(`Existing user found by email: ${existingUser.id}`);

                // Prepare potential updates - only update if data is provided
                const updateData: Partial<DbUserProfile> = {};
                if (firstName && existingUser.first_name !== firstName) updateData.first_name = firstName;
                if (lastName !== undefined && existingUser.last_name !== lastName) updateData.last_name = lastName; // Allow setting null
                if (profilePictureUrl && existingUser.profile_picture_url !== profilePictureUrl) updateData.profile_picture_url = profilePictureUrl;
                
                // --- NOTE: The following requires a 'linkedin_id' text column (or similar) in 'user_profiles' ---
                // Uncomment this block once the column exists
                /* 
                if (provider === 'linkedin' && existingUser.linkedin_id !== providerUserId) { 
                  this.logger.log(`Updating linkedin_id for existing user ${existingUser.id}`);
                  updateData.linkedin_id = providerUserId; 
                }
                */
                // --- End linkedin_id update block ---

                if (Object.keys(updateData).length > 0) {
                    this.logger.log(`Updating profile for existing user ${existingUser.id} with data from ${provider}`);
                    const { error: updateError } = await supabase
                        .from('user_profiles')
                        .update(updateData)
                        .eq('id', existingUser.id);

                    if (updateError) {
                        this.logger.warn(`Could not update profile for user ${existingUser.id}: ${updateError.message}`);
                        // Non-fatal, continue with login
                    }
                     // Merge updates into existingUser for return, avoiding another fetch
                     Object.assign(existingUser, updateData);
                }
                return existingUser as DbUserProfile;

            } else {
                // 2b. User not found by email - create new user
                this.logger.log(`Creating new user profile for email: ${email} from provider: ${provider}`);
                const { data: newUser, error: insertError } = await supabase
                    .from('user_profiles')
                    .insert({
                        email: email,
                        first_name: firstName || null,
                        last_name: lastName || null,
                        profile_picture_url: profilePictureUrl || null,
                        phone_number: '', // Explicitly set required phone_number to empty string
                        // --- NOTE: The following requires a 'linkedin_id' text column (or similar) in 'user_profiles' ---
                        // Uncomment this line once the column exists
                        // linkedin_id: providerUserId,
                    })
                    .select('*') // Select all fields of the new row
                    .single();

                if (insertError) {
                    // Check for unique constraint violation (e.g., email already exists - race condition?)
                    if (insertError.code === '23505') { // PostgreSQL unique violation code
                         this.logger.warn(`Insert failed due to unique constraint (email: ${email}), potentially a race condition. Trying to fetch again.`);
                         // Retry fetching the user who likely just got created
                          const { data: raceUser, error: raceFetchError } = await supabase
                             .from('user_profiles')
                             .select('*')
                             .eq('email', email)
                             .single();
                         if (raceFetchError || !raceUser) {
                             this.logger.error(`Failed to fetch user after suspected race condition for email ${email}: ${raceFetchError?.message || 'Not found'}`);
                             throw new InternalServerErrorException('Database error creating user after race condition.');
                         }
                         this.logger.log(`Successfully fetched user ${raceUser.id} after suspected race condition.`);
                         // Treat as existing user (logic similar to above, maybe less updates needed)
                         return raceUser as DbUserProfile;
                    } else {
                        this.logger.error(`Supabase error inserting new user (${email}): ${insertError.message}`, insertError.stack);
                        throw new InternalServerErrorException('Database error creating user.');
                    }
                }

                if (!newUser) {
                    this.logger.error(`Supabase insert operation did not return the new user data for email: ${email}.`);
                    throw new InternalServerErrorException('Failed to retrieve new user data after creation.');
                }

                this.logger.log(`New user created successfully: ${newUser.id}`);
                return newUser as DbUserProfile;
            }

        } catch (error: unknown) {
            // Catch specific DB errors if needed, re-throw others
            if (error instanceof HttpException) throw error; // Re-throw known http exceptions

            let errorMessage = 'Unknown error during find/create user by provider';
            let errorStack: string | undefined = undefined;
            if (error instanceof Error) {
                errorMessage = error.message;
                errorStack = error.stack;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            this.logger.error(`Error in findOrCreateUserByProvider (${provider}/${email}): ${errorMessage}`, errorStack);
            throw new InternalServerErrorException('Failed to find or create user.'); // Throw generic server error
            // return null; // Or return null if preferred over throwing
        }
    }

     // --- Existing methods (like getUserProfile, updateUserProfile if they belong here) ---
     // Consider moving getUserProfile and updateUserProfile from AuthService to UsersService
     // if they primarily deal with user data management rather than authentication flows.
} 