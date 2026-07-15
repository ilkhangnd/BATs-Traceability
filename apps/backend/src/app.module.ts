import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AppController } from "./app.controller.js";
import { AdminController } from "./admin.controller.js";
import { AdminGuard } from "./admin.guard.js";
import { AdminService } from "./admin.service.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { BatsService } from "./bats.service.js";
import { MerkleService } from "./merkle.service.js";
import { StoreService } from "./store.service.js";
import { ValidationService } from "./validation.service.js";
import { DatabaseModule } from "./database/database.module.js";
import { AccessGuard } from "./access.guard.js";
import { EvidenceController } from "./evidence.controller.js";
import { EvidenceService } from "./evidence.service.js";
import { AnchorController } from "./anchor.controller.js";
import { AnchorService } from "./anchor.service.js";
import { DossierService } from "./dossier.service.js";
import { MetricsService } from "./metrics.service.js";
import { ObservabilityInterceptor } from "./observability.interceptor.js";
import { RateLimitInterceptor } from "./rate-limit.guard.js";
import { AnchorSchedulerService } from "./anchor-scheduler.service.js";
import { PilotResearchController } from "./research/pilot.controller.js";
import { PilotResearchService } from "./research/pilot.service.js";

@Module({
  imports: [DatabaseModule],
  controllers: [
    AppController,
    AuthController,
    AdminController,
    EvidenceController,
    AnchorController,
    PilotResearchController
  ],
  providers: [
    BatsService,
    StoreService,
    ValidationService,
    MerkleService,
    AuthService,
    AdminGuard,
    AdminService,
    AccessGuard,
    EvidenceService,
    AnchorService,
    AnchorSchedulerService,
    DossierService,
    MetricsService,
    PilotResearchService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ObservabilityInterceptor
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitInterceptor
    }
  ]
})
export class AppModule {}
