import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  // --- Revert Logger Config ---
  const isProduction = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create(AppModule, {
    logger: isProduction
        ? ['warn', 'error']
        : ['log', 'debug', 'verbose', 'warn', 'error'], // Dynamic levels
  });
  // ---------------------------
  const logger = new Logger('Bootstrap'); // Keep NestJS logger

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  const configService = app.get(ConfigService);

  // Read origins from environment variable, split by comma, default to empty array
  const allowedOrigins = (configService.get<string>('ALLOWED_ORIGINS') || '')
    .split(',')
    .map(origin => origin.trim()) // Trim whitespace
    .filter(Boolean);

  console.log('Allowed CORS Origins:', allowedOrigins); // Keep console log for startup verification
  logger.log(`Configuring CORS for origins: ${allowedOrigins.join(', ')}`);

  if (allowedOrigins.length > 0) {
      app.enableCors({
          origin: allowedOrigins, // Use the array of allowed origins
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
          allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
          credentials: true,
          preflightContinue: false,
          optionsSuccessStatus: 204
      });
      logger.log(`CORS enabled for specific origins.`);
  } else {
       logger.warn('No ALLOWED_ORIGINS defined. CORS might not allow frontend requests.');
       // Optionally enable for all in development if needed, but risky
       // if (!isProduction) {
       //     app.enableCors({ origin: true, credentials: true });
       //     logger.warn('Allowing all origins in non-production mode due to missing ALLOWED_ORIGINS.');
       // }
  }


  app.use(cookieParser());

  const port = configService.get<number>('PORT') || 3001; // Vercel ignores this, but good practice

  await app.listen(port);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap(); 