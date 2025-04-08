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
  requestId?: string;
  accessToken?: string;
  status?: string;
  // Add other potential fields if Truecaller sends them
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  @Post('true-sdk')
  async handleTruecallerCallback(
    @Body() callbackData: TruecallerCallbackDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    this.logger.log(
      `Received Truecaller callback for requestId: ${callbackData.requestId ?? 'N/A'}`,
    );
    this.logger.debug(`Truecaller Callback Headers: ${JSON.stringify(req.headers)}`);
    this.logger.debug(`Full Truecaller Callback Body: ${JSON.stringify(callbackData)}`);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || '';
    if (!frontendUrl) {
        this.logger.error('FRONTEND_URL environment variable is not set!');
        throw new HttpException('Server configuration error', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!callbackData.accessToken) {
        this.logger.error('Access Token missing in Truecaller callback payload');
        this.logger.log(`Redirecting due to missing token: ${frontendUrl}/?error=CallbackTokenMissing`);
        res.redirect(`${frontendUrl}/?error=CallbackTokenMissing`);
        return;
    }

    try {
      const result = await this.authService.verifyTruecallerUser(
        callbackData.accessToken,
      );

      if (result.success && result.access_token) {
        this.logger.log(`Truecaller verification successful for user: ${result.userId}`);
        
        res.cookie('auth-token', result.access_token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          partitioned: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/',
        });
        
        this.logger.log(`Redirecting after successful Truecaller login: ${frontendUrl}/dashboard?login=success`);
        res.redirect(`${frontendUrl}/dashboard?login=success`);
      } else {
        this.logger.warn(
          `Verification failed: ${result.error}. RequestId: ${callbackData.requestId ?? 'N/A'}`,
        );
        const redirectUrl = `${frontendUrl}/login?error=${result.error || 'TruecallerVerificationFailed'}`;
        this.logger.log(`Redirecting after failed Truecaller verification: ${redirectUrl}`);
        res.redirect(redirectUrl);
      }
    } catch (error: any) {
      this.logger.error(
        `Internal server error during Truecaller verification: ${error?.message || error}`,
        error?.stack,
      );
      const redirectUrl = `${frontendUrl}/login?error=ServerError`;
      this.logger.log(`Redirecting after internal server error: ${redirectUrl}`);
      res.redirect(redirectUrl);
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

        res.cookie('auth-token', result.access_token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          partitioned: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/',
        });

        return { success: true, userId: result.userId };
      } else {
        this.logger.warn(
          `Phone.email verification failed: ${result.error}`,
        );
        throw new HttpException(
          result.error || 'PhoneEmailVerificationFailed',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error: any) {
        if (error instanceof HttpException) {
           throw error;
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

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: Request) {
    this.logger.log(`Fetching profile for user: ${req.user?.sub}`);
    if (!req.user?.sub) {
      throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
    }
    const userProfile = await this.authService.getUserProfile(req.user.sub);
    if (!userProfile) {
      throw new HttpException('Profile not found', HttpStatus.NOT_FOUND);
    }
    return userProfile;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    this.logger.log('Logging out user');
    res.clearCookie('auth-token', { path: '/' });
    return { message: 'Logged out successfully' };
  }

  @Get('ping')
  ping(): string {
      this.logger.log('Received ping request');
      return 'pong';
  }
} 