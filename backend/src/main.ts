import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { loggerMiddleware } from './common/middleware/request-logging.middleware';
import { TransformInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DEFAULT_TAG, SWAGGER_API_ROOT, SWAGGER_JWT } from './common/constant/global';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for development
  app.enableCors();
  app.use(loggerMiddleware);
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const urlCors = process.env.URL_CORS || '*';
  const config = new DocumentBuilder()
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        SWAGGER_JWT,
      )
      .setTitle('Course registration')
      .setDescription('Course registration API description')
      .setVersion('1.0')
      .addTag(DEFAULT_TAG)
      .build();
    const logger = new Logger('Swagger');
    const document = SwaggerModule.createDocument(app, config);
    logger.debug(`Swagger API document: ${JSON.stringify(document.components)}`);
    logger.debug(`Swagger API Root: ${SWAGGER_API_ROOT}`);
    SwaggerModule.setup(SWAGGER_API_ROOT, app, document, {
      swaggerOptions: {
        consumes: ['multipart/form-data'],
      },
    });
  app.enableCors({
    exposedHeaders: ['Content-Disposition'],
    origin: urlCors,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
