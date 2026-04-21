import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ThrottleExceptionFilter } from './common/filters/throttle-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // HTTP security headers
  app.use(helmet());

  // CORS — only allow known origins
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Convert ThrottlerException → 429 + record IP violation
  app.useGlobalFilters(new ThrottleExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
  console.log(`MetaQuest API running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
