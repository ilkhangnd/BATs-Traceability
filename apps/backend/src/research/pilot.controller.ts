import { Body, Controller, Get, Post } from "@nestjs/common";
import { PilotResearchService, PilotSubmissionDto } from "./pilot.service.js";

@Controller("api/research/pilot")
export class PilotResearchController {
  constructor(private readonly pilotService: PilotResearchService) {}

  @Post("submit")
  async submitPilot(@Body() dto: PilotSubmissionDto) {
    return this.pilotService.submitPilotResult(dto);
  }

  @Get("summary")
  async getSummary() {
    return this.pilotService.getSummary();
  }
}
