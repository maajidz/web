import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
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
    console.log(`${req.method} ${req.url}`);
    console.log('Origin:', req.headers.origin);
    console.log('Headers:', req.headers);
    next();
  });

  app.use(cookieParser());
  
  const port = configService.get<number>('PORT') || 3001;

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap(); 