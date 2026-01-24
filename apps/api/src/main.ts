import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cookie parser para suporte a httpOnly cookies
  app.use(cookieParser());

  // Debug: log de cookies em desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    app.use((req: any, res: any, next: any) => {
      console.log('🍪 [DEBUG] Cookies recebidos:', Object.keys(req.cookies || {}));
      console.log('🔑 [DEBUG] Headers relevantes:', {
        'x-csrf-token': req.headers['x-csrf-token'],
        'authorization': req.headers['authorization']?.substring(0, 30) + '...',
        'cookie': req.headers['cookie']?.substring(0, 50) + '...',
      });
      next();
    });
  }

  // Enable CORS - múltiplas portas para desenvolvimento
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3000',
      process.env.CORS_ORIGIN,
    ].filter(Boolean),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Admin Panel API')
    .setDescription('API do painel administrativo INVISTTO')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3002;
  await app.listen(port);

  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
