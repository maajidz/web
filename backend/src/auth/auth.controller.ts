import {
  Controller,
  Post,
  Body,
  Res,
  Logger,
  HttpStatus,
  Query,
  Get,
  UseGuards,
  Request as Req,
  HttpException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PhoneEmailVerifyDto } from './dto/phone-email-verify.dto';
import { ConfigService } from '@nestjs/config';

// DTO for expected callback body (adjust if needed based on actual Truecaller payload)
class TruecallerCallbackDto {
  requestId: string = '';
  accessToken: string = '';
  // Add other potential fields if Truecaller sends them
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  @Post('true-sdk') // Matches your specified callback URL path
  async handleTruecallerCallback(
    @Body() callbackData: TruecallerCallbackDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.log(
      `Received Truecaller callback for requestId: ${callbackData.requestId}`,
    );
    // Log the entire received body for debugging
    this.logger.debug(`Full Truecaller Callback Body: ${JSON.stringify(callbackData)}`);

    // Get frontend URL from config
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || '';
    if (!frontendUrl) {
        this.logger.error('FRONTEND_URL environment variable is not set!');
        // Handle error appropriately, maybe redirect to a generic error page or return 500
        throw new HttpException('Server configuration error', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!callbackData.accessToken) {
        this.logger.error('Access Token missing in Truecaller callback');
        // Redirect back to frontend with error
        return res.redirect(`${frontendUrl}/?error=CallbackTokenMissing`);
    }

    try {
      const result = await this.authService.verifyTruecallerUser(
        callbackData.accessToken,
      );

      if (result.success && result.access_token) {
        this.logger.log(`Truecaller verification successful for user: ${result.userId}`);
        
        // Set JWT in HttpOnly cookie
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('auth-token', result.access_token, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          partitioned: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/',
        });
        
        // Redirect user back to the frontend dashboard (or a success page)
        res.redirect(`${frontendUrl}/dashboard?login=success`);
      } else {
        this.logger.warn(
          `Verification failed: ${result.error}. RequestId: ${callbackData.requestId}`,
        );
        // Redirect back to frontend with specific error using configured URL
        res.redirect(`${frontendUrl}/login?error=${result.error || 'TruecallerVerificationFailed'}`);
      }
    } catch (error: any) {
      this.logger.error(
        `Internal server error during Truecaller verification: ${error?.message || error}`,
        error?.stack,
      );
      // Redirect back to frontend with a generic server error using configured URL
      res.redirect(`${frontendUrl}/login?error=ServerError`);
    }
  }

  @Post('phone-email/verify')
  async verifyPhoneEmail(
    @Body() phoneEmailVerifyDto: PhoneEmailVerifyDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.log(
      `Received Phone.email verification request for URL starting with: ${phoneEmailVerifyDto.user_json_url.substring(0, 30)}...`,
    );

    try {
      const result = await this.authService.verifyPhoneEmail(
        phoneEmailVerifyDto.user_json_url,
      );

      if (result.success && result.access_token) {
        this.logger.log(`Phone.email verification successful for user: ${result.userId}`);

        // Set JWT in HttpOnly cookie (same as Truecaller)
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('auth-token', result.access_token, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          // partitioned: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/',
        });

        // Send success response (no redirect needed as this is called via fetch)
        return { success: true, userId: result.userId };
      } else {
        this.logger.warn(
          `Phone.email verification failed: ${result.error}`,
        );
        // Throw HttpException for the frontend fetch to catch
        throw new HttpException(
          result.error || 'PhoneEmailVerificationFailed',
          HttpStatus.BAD_REQUEST, // Or potentially UNAUTHORIZED depending on error
        );
      }
    } catch (error: any) {
        // Handle errors thrown from the service or the HttpException above
        if (error instanceof HttpException) {
           throw error; // Re-throw known HTTP exceptions
        }
      this.logger.error(
        `Internal server error during Phone.email verification: ${error?.message || error}`,
        error?.stack,
      );
       throw new HttpException(
         'InternalServerError',
         HttpStatus.INTERNAL_SERVER_ERROR,
       );
    }
  }

  // New protected route
  @UseGuards(JwtAuthGuard) // Apply the guard
  @Get('profile')
  async getProfile(@Req() req: Request) { // Access the extended Request object
    this.logger.log(`Fetching profile for user: ${req.user?.sub}`);
    if (!req.user?.sub) {
      throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
    }
    // Fetch the full profile using the service method
    const userProfile = await this.authService.getUserProfile(req.user.sub);
    if (!userProfile) {
      throw new HttpException('Profile not found', HttpStatus.NOT_FOUND);
    }
    return userProfile;
  }

  // Optional: Add a logout route
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    this.logger.log('Logging out user');
    res.clearCookie('auth-token', { path: '/' }); // Clear the auth cookie
    return { message: 'Logged out successfully' };
  }

  // --- Simple Diagnostic Route ---
  @Get('ping')
  ping(): string {
      this.logger.log('Received ping request');
      return 'pong';
  }
} 