import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix("api");

  // CORS Configuration
  app.enableCors({
    origin: (origin, callback) => {
      // Allow all local dev origins or any specified in env
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle("TruyenKomi API")
    .setDescription("Hệ thống Backend REST API cho nền tảng đọc và quản lý truyện tranh TruyenKomi")
    .setVersion("1.0.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Nhập Access Token JWT",
        in: "header",
      },
      "JWT-auth",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
    customSiteTitle: "TruyenKomi API Documentation",
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`🚀 NestJS Backend is running at http://localhost:${port}/api`);
  logger.log(`📚 Swagger API Documentation is available at http://localhost:${port}/api/docs`);
}

bootstrap();
