import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HttpModule } from '@nestjs/axios'; // Needed for Truecaller API calls
import { SupabaseModule } from '../supabase/supabase.module'; // Needed for database interaction
import { JwtModule } from '@nestjs/jwt'; // Import JwtModule
import { ConfigModule, ConfigService } from '@nestjs/config'; // Import ConfigModule and ConfigService
import { Buffer } from 'buffer'; // Import Buffer
import { UsersModule } from '../users/users.module'; // Import UsersModule
// import { jwtConstants } from './constants'; // No longer needed if using ConfigService

@Module({
  imports: [
    ConfigModule, // Ensure ConfigModule is imported (needed for ConfigService injection)
    HttpModule, // Make HttpService available
    SupabaseModule, // Make SupabaseService available
    UsersModule, // Add UsersModule here
    JwtModule.registerAsync({
      imports: [ConfigModule], // Import ConfigModule here too
      useFactory: async (configService: ConfigService) => {
        const secretBase64 = configService.get<string>('JWT_SECRET');
        if (!secretBase64) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        // Decode the Base64 secret into a Buffer
        const secret = Buffer.from(secretBase64, 'base64');
        return {
            secret: secret,
            signOptions: { expiresIn: '7d' }, // Keep expiration
        };
      },
      inject: [ConfigService], // Inject ConfigService into the factory
      global: true, // Keep global if needed
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {} 