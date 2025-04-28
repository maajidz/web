import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';


@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.['auth-token'];
    this.logger.debug(`[Guard] Checking for auth token in cookie...`); // Log entry

    if (!token) {
      this.logger.warn('[Guard] No auth token found in cookie. Rejecting.');
      throw new UnauthorizedException('Authentication token not found');
    }
    
    this.logger.debug(`[Guard] Auth token found. Verifying... Token starts with: ${token.substring(0, 10)}...`); // Log token presence

    try {
      const payload = await this.jwtService.verifyAsync(token);
      this.logger.debug(`[Guard] Token verification successful. Payload sub: ${payload?.sub}`); // Log success
      
      request.user = payload;
      
    } catch (error: any) {
      this.logger.error(`[Guard] Token verification failed: ${error?.message || error}`, error?.stack); // Log failure reason
      throw new UnauthorizedException('Invalid or expired token');
    }
    this.logger.debug('[Guard] Granting access.'); // Log granting access
    return true; 
  }
} 