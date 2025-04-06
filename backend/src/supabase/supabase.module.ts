import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.service';

@Global() // Make SupabaseService available globally
@Module({
  imports: [ConfigModule], // Import ConfigModule to read .env
  providers: [SupabaseService],
  exports: [SupabaseService], // Export the service
})
export class SupabaseModule {} 