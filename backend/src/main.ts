import './instrument';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { shouldExposeSwaggerDocs } from './config/swagger-env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));
  app.use(helmet());
  app.setGlobalPrefix('api/v1');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (shouldExposeSwaggerDocs()) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Smart Triage API')
      .setDescription(
        'Smart Triage — support ticket ingestion, LLM triage, and agent workflows.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, { useGlobalPrefix: true });
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const base = `http://localhost:${port}`;
  console.log(`🚀 Smart Triage is running on: ${base}`);
  if (shouldExposeSwaggerDocs()) {
    console.log(`📚 Swagger documentation available at: ${base}/api/v1/docs`);
  }
  console.log(
    `📊 Queue monitoring available at: ${base}/api/v1/admin/triage-bullmq/stats`,
  );
}

bootstrap().catch((err: unknown) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
