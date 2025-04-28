import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // --- Get underlying Express adapter and set trust proxy ---
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);
  // -------------------------------------------------------

  const configService = app.get(ConfigService);

  // Parse allowed origins from environment or use defaults
  const allowedOriginsStr = configService.get<string>('ALLOWED_ORIGINS') || '';
  const defaultOrigins = [
    'http://localhost:3000',
    'http://192.168.29.30:3000',
    'https://flattr.io',
    'https://www.flattr.io',
    /\\.ngrok-free\\.app$/,
    /\\.vercel\\.app$/,
    /\\.onrender\\.com$/
  ];
  
  // Combine environment origins with defaults
  const allowedOrigins = [
    ...defaultOrigins,
    ...allowedOriginsStr.split(',').filter(origin => origin.trim())
  ];
  
  logger.log(`Allowed origins: ${JSON.stringify(allowedOrigins)}`);

  // Update CORS configuration
  app.enableCors({
    origin: allowedOrigins, // Restore original allowed origins list
    credentials: true,  
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  app.use(cookieParser());
  
  const port = configService.get<number>('PORT') || 3001;

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();