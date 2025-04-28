        // backend/src/auth/entities/user-profile.entity.ts
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