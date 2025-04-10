import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private _supabaseAdmin!: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      this.logger.error(
        'Supabase URL or Service Role Key not found in environment variables.',
      );
      throw new Error(
        'Supabase URL or Service Role Key missing environment configuration.',
      );
    }

    this._supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        // Required for service role key
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.logger.log('Supabase Admin Client Initialized');
  }

  get supabaseAdmin(): SupabaseClient {
    if (!this._supabaseAdmin) {
       // This should ideally not happen due to OnModuleInit, but acts as a safeguard
       this.logger.error('Supabase Admin Client requested before initialization.');
       throw new Error('Supabase client not initialized.');
    }
    return this._supabaseAdmin;
  }
} 