import "reflect-metadata";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";

for (const candidate of [
  process.env.BATS_ENV_FILE,
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../.env")
]) {
  if (candidate && existsSync(candidate)) {
    loadEnvFile(candidate);
    break;
  }
}

if (process.env.NODE_ENV === "production") {
  for (const key of ["DATABASE_URL", "SESSION_SECRET", "ADMIN_PASSWORD"]) {
    if (!process.env[key]) throw new Error(`Thiếu biến môi trường production bắt buộc: ${key}`);
  }
  if ((process.env.SESSION_SECRET?.length ?? 0) < 32) {
    throw new Error("SESSION_SECRET production phải có ít nhất 32 ký tự.");
  }
}

const app = await NestFactory.create(AppModule);
app.enableShutdownHooks();
app.use(
  (
    request: { url?: string },
    response: { setHeader(name: string, value: string): void },
    next: () => void
  ) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    response.setHeader("Cross-Origin-Resource-Policy", "same-site");
    const documentation = request.url?.startsWith("/docs");
    response.setHeader(
      "Content-Security-Policy",
      documentation
        ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'"
        : "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
    );
    if (process.env.NODE_ENV === "production") {
      response.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains"
      );
    }
    next();
  }
);
const configuredOrigins = (
  process.env.WEB_ORIGINS ??
  "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"
)
  .split(",")
  .map((origin) => origin.trim());
app.enableCors({
  origin: (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void
  ) => {
    const localDevelopmentOrigin =
      process.env.NODE_ENV !== "production" &&
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin ?? "");
    if (!origin || configuredOrigins.includes(origin) || localDevelopmentOrigin) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin ${origin} không được phép bởi CORS.`));
  },
  credentials: true
});
if (process.env.OPENAPI_ENABLED !== "false") {
  const config = new DocumentBuilder()
    .setTitle("BATS Traceability API")
    .setDescription(
      "API truy xuất nguồn gốc nông sản: GS1 Digital Link, EPCIS 2.0, PostGIS validation và daily Merkle anchor."
    )
    .setVersion("0.1.0")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "BATS actor token" },
      "actor-token"
    )
    .addCookieAuth("bats_session", { type: "apiKey", in: "cookie" }, "admin-session")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document, {
    jsonDocumentUrl: "openapi.json",
    swaggerOptions: { persistAuthorization: true }
  });
}
await app.listen(Number(process.env.API_PORT ?? 4000));
