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

  // Update CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://192.168.29.30:3000',
      /\.ngrok-free\.app$/,  // Allow all Ngrok URLs
      process.env.FRONTEND_URL, // Also allow the frontend URL from env
    ],
    credentials: true,  // CRITICAL for cookie auth
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  app.use(cookieParser());
  
  const port = configService.get<number>('PORT') || 3001;

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap(); 