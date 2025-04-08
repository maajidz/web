import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { Logger, LogLevel } from '@nestjs/common';

async function bootstrap() {
  // Determine logging level based on environment
  const isProduction = process.env.NODE_ENV === 'production';
  const logLevels: LogLevel[] = isProduction
    ? ['warn', 'error'] // Production: Only warnings and errors
    : ['log', 'debug', 'verbose', 'warn', 'error']; // Development: All levels

  // Pass logger config to NestFactory
  const app = await NestFactory.create(AppModule, {
    logger: logLevels,
  });
  const logger = new Logger('Bootstrap');

  // --- Get underlying Express adapter and set trust proxy ---
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);
  // -------------------------------------------------------

  const configService = app.get(ConfigService);

  // Read origins from environment variable, split by comma, default to empty array
  const allowedOrigins = (configService.get<string>('ALLOWED_ORIGINS') || '').split(',').filter(Boolean);
  
  // Log the loaded origins for debugging
  console.log('Allowed CORS Origins:', allowedOrigins);

  app.enableCors({
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.length === 0) {
          // If no origins are configured, potentially block all CORS requests or log a warning
          console.warn('No ALLOWED_ORIGINS configured in .env file. Blocking CORS request from:', origin);
          return callback(new Error('Not allowed by CORS'), false);
      }
      
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
        console.error(msg); // Log blocked origins
        return callback(new Error('Not allowed by CORS'), false);
      }
      return callback(null, true);
    },
    credentials: true
  });

  app.use(cookieParser());
  
  const port = configService.get<number>('PORT') || 3001;

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap(); 