        // backend/src/auth/entities/user-profile.entity.ts
        // Define the user profile entity interfaces
        export interface UserProfile {
            id: string;
            phone_number: string;
            first_name?: string | null;
            last_name?: string | null;
            email?: string | null;
            profile_picture_url?: string | null;
            // Add other fields that match your Supabase table columns
            created_at: string;
            updated_at?: string | null;
        }

        // Interface for the user profile in Supabase table
        // This should be used for database operations
        export interface DbUserProfile {
            id: string;
            phone_number: string;
            first_name?: string | null;
            last_name?: string | null;
            email?: string | null;
            profile_type?: string | null;
            bio?: string | null;
            profile_picture_url?: string | null;
            created_at: string;
            updated_at?: string | null;
        }