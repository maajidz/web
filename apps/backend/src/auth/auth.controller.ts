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
  Patch,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PhoneEmailVerifyDto } from './dto/phone-email-verify.dto';
import { ConfigService } from '@nestjs/config';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { TruecallerCallbackDto } from './dto/truecaller-callback.dto';
import { CacheModule, CacheInterceptor, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { UserProfile, DbUserProfile } from './entities/user-profile.entity';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  @Post('true-sdk')
  async handleTruecallerCallback(
    @Body() callbackData: TruecallerCallbackDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.log('Received Truecaller callback with data:');
    this.logger.log(JSON.stringify(callbackData));
    this.logger.log(`Received Truecaller callback for requestId: ${callbackData.requestId}`);
    
    this.logger.debug('Full request body:', JSON.stringify(req.body));
    this.logger.debug('Request headers:', JSON.stringify(req.headers));
    
    // --- Check if request ID was recently processed ---
    const processedKey = `truecaller_processed_${callbackData.requestId}`;
    const alreadyProcessed = await this.cacheManager.get(processedKey);
    if (alreadyProcessed) {
        this.logger.warn(`Duplicate Truecaller callback received for already processed requestId: ${callbackData.requestId}. Ignoring.`);
        // Send a simple OK to prevent client errors, but don't re-process
        res.status(HttpStatus.OK).send({ status: 'ok', message: 'Duplicate request ignored' });
        return;
    }
    // --- End Check ---
    
    // Determine frontend URL: Prioritize x-forwarded-host if behind proxy, then origin/referer, then env var
    const xForwardedHost = req.headers['x-forwarded-host'] as string;
    let derivedFrontendUrl: string | undefined;
    if (xForwardedHost) {
        // Ensure it uses https if x-forwarded-proto is set, or assume https for common proxy setups
        const proto = req.headers['x-forwarded-proto'] === 'http' ? 'http' : 'https';
        derivedFrontendUrl = `${proto}://${xForwardedHost}`;
    }
    const frontendUrl = derivedFrontendUrl || req.headers.origin || req.headers.referer || this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    this.logger.log(`Using frontend URL for redirect: ${frontendUrl}`);
    
    if (callbackData.status && callbackData.status === 'flow_invoked') { 
      this.logger.log('Received initial flow_invoked callback - waiting for second callback with token');
      // For the first callback, just return OK status, no redirect needed.
      res.status(HttpStatus.OK).send({ status: 'ok', message: 'Flow invoked callback received' });
      return; // Explicitly return here to prevent further processing
    }
    
    try {
      this.logger.log(`Processing Truecaller callback for token access`);
      const result = await this.authService.verifyTruecallerUser(callbackData);
      this.logger.log(`Truecaller verification successful for user: ${result.userId}`);
      
      // --- Mark request ID as processed in cache (e.g., for 60 seconds) ---
      await this.cacheManager.set(processedKey, true, 60);
      // --- End Mark ---
      
      const cookieDomain = this.getCookieDomain(req);
      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'none' as const,
        domain: cookieDomain, // Use dynamic domain
        partitioned: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      };
      
      this.logger.log(`Setting auth cookie for user ${result.userId}`);
      this.logger.debug(`Setting auth cookie with options: ${JSON.stringify(cookieOptions)}`);
      
      res.cookie('auth-token', result.access_token, cookieOptions);
      
      const redirectUrl = `${frontendUrl}/dashboard?user_id=${result.userId}&auth_success=true`;
      this.logger.log(`Redirecting user ${result.userId} to: ${redirectUrl}`);
      res.redirect(redirectUrl);
      // DO NOT return anything here, as res.redirect() handles the response.

    } catch (error: unknown) {
      // ... (keep existing error handling and redirect logic) ...
      let errorMessage = 'Unknown error processing Truecaller callback';
      let errorStack: string | undefined = undefined;
      if (error instanceof Error) {
        errorMessage = error.message;
        errorStack = error.stack;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      this.logger.error(errorMessage, errorStack);
      
      // Redirect with error
      const errorRedirectUrl = `${frontendUrl}?error=TC_FAILED`;
      this.logger.error(`Redirecting on error to: ${errorRedirectUrl}`);
      res.redirect(errorRedirectUrl);
    }
  }

  @Post('phone-email/verify')
  async verifyPhoneEmail(
    @Body() phoneEmailVerifyDto: PhoneEmailVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.log(
      `Received Phone.email verification request for URL starting with: ${phoneEmailVerifyDto.user_json_url.substring(0, 30)}...`,
    );

    try {
      const result = await this.authService.verifyPhoneEmail(
        phoneEmailVerifyDto.user_json_url,
      );

      if (result.success && result.access_token && result.userId) { // Check userId too
        this.logger.log(`Phone.email verification successful for user: ${result.userId}`);

        // Set JWT in HttpOnly cookie (same as Truecaller)
        const cookieDomain = this.getCookieDomain(req);
        const cookieOptions = {
          httpOnly: true,
          secure: true,
          sameSite: 'none' as const,
          domain: cookieDomain,
          partitioned: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/',
        };
        
        this.logger.debug(`Setting auth cookie with options: ${JSON.stringify(cookieOptions)}`);
        res.cookie('auth-token', result.access_token, cookieOptions);

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
    } catch (error: unknown) { // Catch unknown errors
        // Handle errors thrown from the service or the HttpException above
        if (error instanceof HttpException) {
           throw error; // Re-throw known HTTP exceptions
        }
        
        let errorMessage = 'Internal server error during Phone.email verification';
        let errorStack: string | undefined = undefined;
        if (error instanceof Error) {
          errorMessage = error.message;
          errorStack = error.stack;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        this.logger.error(errorMessage, errorStack);
        
       throw new HttpException(
         'InternalServerError',
         HttpStatus.INTERNAL_SERVER_ERROR,
       );
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request): Promise<DbUserProfile> {
    try {
      const userId = req['user']?.userId;

      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }

      const userProfile = await this.authService.getUserProfile(userId);
      
      if (!userProfile) {
        throw new UnauthorizedException('User profile not found');
      }
      
      return userProfile;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error getting profile: ${errorMessage}`, errorStack);
      throw error instanceof HttpException ? error : new HttpException('Error retrieving profile', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('debug-request')
  async debugRequest(@Req() req: Request) {
    this.logger.log('Debug request received');
    
    // Extract relevant headers and cookies
    const headers = {
      host: req.headers.host,
      'x-forwarded-host': req.headers['x-forwarded-host'],
      'x-forwarded-proto': req.headers['x-forwarded-proto'],
      'user-agent': req.headers['user-agent'],
      origin: req.headers.origin,
      referer: req.headers.referer,
      cookie: !!req.headers.cookie,  // Just log presence of cookie header, not the actual values
    };
    
    // Log cookie names without values for privacy
    const cookieNames = req.cookies ? Object.keys(req.cookies) : [];
    
    // Try to parse auth token if present (without logging the full token)
    let authTokenInfo: string | Record<string, any> = 'Not present';
    if (req.cookies && req.cookies['auth-token']) {
      const token = req.cookies['auth-token'];
      try {
        // Just check if it can be decoded and log if it has expected fields
        const decoded = this.authService.decodeToken(token);
        authTokenInfo = {
          valid: true,
          hasUserId: !!decoded?.userId || !!decoded?.sub,
          expiry: decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : 'unknown',
        };
      } catch (e) {
        authTokenInfo = { valid: false, error: e instanceof Error ? e.message : String(e) };
      }
    }
    
    return {
      timestamp: new Date().toISOString(),
      headers,
      cookieNames,
      authTokenInfo,
    };
  }

  @Post('complete-profile')
  @UseGuards(JwtAuthGuard)
  async completeProfile(
    @Req() req: Request,
    @Body() body: { firstName: string; lastName?: string; profilePictureUrl?: string }
  ): Promise<DbUserProfile> {
    try {
      const userId = req['user']?.userId;
      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }

      const { firstName, lastName, profilePictureUrl } = body;
      
      if (!firstName || firstName.trim() === '') {
        throw new HttpException('First name is required', HttpStatus.BAD_REQUEST);
      }

      const updatedProfile = await this.authService.updateUserProfile(
        userId,
        firstName,
        lastName || null,
        profilePictureUrl || null
      );

      return updatedProfile;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error completing profile: ${errorMessage}`, errorStack);
      throw error instanceof HttpException ? error : new HttpException('Error updating profile', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.logger.log('Logging out user');
    const cookieDomain = this.getCookieDomain(req);
    const cookieOptions = { 
      path: '/',
      domain: cookieDomain,
      secure: true,
      httpOnly: true,
      sameSite: 'none' as const,
      partitioned: true
    };
    this.logger.debug(`Clearing auth cookie with options: ${JSON.stringify(cookieOptions)}`);
    res.clearCookie('auth-token', cookieOptions);
    return { message: 'Logged out successfully' };
  }

  @Get('ping')
  ping(): string {
      this.logger.log('Received ping request');
      return 'pong';
  }

  private getCookieDomain(req: Request): string | undefined {
    const host = req.headers.host || '';
    this.logger.debug(`Determining cookie domain for host: ${host}`);
    
    // For localhost or IP address
    if (host.includes('localhost') || /^\d+\.\d+\.\d+\.\d+/.test(host.split(':')[0])) { // Check only the host part before port
      this.logger.debug('Host is localhost or IP, returning undefined domain.');
      return undefined;
    }
    
    // For Ngrok domains - return undefined to use the current host
    if (host.includes('ngrok-free.app') || host.includes('ngrok.io')) {
        this.logger.debug(`Host is Ngrok, returning undefined domain.`);
        return undefined;
    }
    
    // For Pinggy.io domains - return undefined to use the current host
    if (host.includes('.free.pinggy.link')) {
      this.logger.debug(`Host is Pinggy.io, returning undefined domain.`);
      return undefined;
    }
    
    // For Vercel preview domains
    if (host.includes('vercel.app')) {
      this.logger.debug(`Host is Vercel preview, returning undefined domain.`);
      return undefined;
    }
    
    // For production domain
    if (host.includes('flattr.io')) {
      this.logger.debug('Host is flattr.io, returning domain: .flattr.io');
      return '.flattr.io'; // Note the leading dot for subdomains
    }
    
    // Default: don't set domain
    this.logger.debug('Host does not match known patterns, returning undefined domain.');
    return undefined;
  }
} 