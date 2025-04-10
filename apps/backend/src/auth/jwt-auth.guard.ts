import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';


@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.['auth-token']; // Extract token from cookie

    if (!token) {
      this.logger.warn('No auth token found in cookie');
      throw new UnauthorizedException('Authentication token not found');
    }

    try {
      // Verify the token using the secret configured in JwtService
      // No need to specify secret here if JwtModule is configured correctly
      const payload = await this.jwtService.verifyAsync(token);
      
      // Attach the payload to the request object
      // So we can access it in our route handlers
      request.user = payload;
      
    } catch (error: any) {
      this.logger.error(`Token verification failed: ${error?.message || error}`, error?.stack);
      // Clear potentially invalid cookie?
      // context.switchToHttp().getResponse().clearCookie('auth-token');
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true; // Token is valid, allow access
  }
} 