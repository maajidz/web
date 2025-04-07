import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  
  const configService = app.get(ConfigService);

  // Read origins from environment variable, split by comma, default to empty array
  const allowedOrigins = (configService.get<string>('ALLOWED_ORIGINS') || '').split(',').filter(Boolean);
  
  // Log the loaded origins for debugging
  console.log('Allowed CORS Origins:', allowedOrigins);

  app.enableCors({
    origin: '*', // Allow all origins temporarily for debugging
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // Add a middleware to log all requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.log(`Incoming ${req.method} request to ${req.url}`);
    logger.log('Request Headers:', req.headers);
    next();
  });

  app.use(cookieParser());
  
  const port = configService.get<number>('PORT') || 3001;

  await app.listen(port);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap(); 