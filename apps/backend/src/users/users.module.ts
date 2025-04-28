import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
// Import SupabaseModule if UsersService depends on SupabaseService
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule], // Import SupabaseModule here
  providers: [UsersService],
  exports: [UsersService], // Export UsersService so other modules can import UsersModule and use it
})
export class UsersModule {} 