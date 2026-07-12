import { z } from "zod";
import { AIClient } from "./AIClient";
import { PromptBuilder } from "./PromptBuilder";
import { JsonResponseParser } from "./JsonResponseParser";

const ExecutiveSummarySchema = z.object({ executiveSummary: z.string() });
const MethodologySchema = z.object({ methodology: z.string() });
const ConclusionSchema = z.object({ conclusion: z.string() });
const ObservationSchema = z.object({ observation: z.string() });
const RecommendationSchema = z.object({ recommendation: z.string() });
const BusinessImpactSchema = z.object({ businessImpact: z.string() });
const RiskSummarySchema = z.object({ riskSummary: z.string() });

export class AIService {
  private aiClient: AIClient;
  private promptBuilder: PromptBuilder;

  constructor() {
    this.aiClient = new AIClient();
    this.promptBuilder = new PromptBuilder();
  }

  private async generateAndParse<T>(prompt: string, schema: z.ZodSchema<T>, promptType: string, projectId: string): Promise<T> {
    const startTime = Date.now();
    try {
      const rawResponse = await this.aiClient.generate(prompt);
      const parsed = JsonResponseParser.parseAndValidate(rawResponse, schema);
      
      const duration = Date.now() - startTime;
      this.logUsage(projectId, promptType, duration, true);
      
      return parsed;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logUsage(projectId, promptType, duration, false, error.message);
      throw error;
    }
  }

  private logUsage(projectId: string, promptType: string, durationMs: number, success: boolean, errorMsg?: string) {
    // In a real implementation, this would write to a DB or logger
    console.log(`[AI Log] Project: ${projectId} | Type: ${promptType} | Duration: ${durationMs}ms | Success: ${success}`);
    if (errorMsg) {
      console.error(`[AI Error] ${errorMsg}`);
    }
  }

  async generateExecutiveSummary(projectId: string, assessmentType: string, applicationName: string, organization: string, targetUrl: string) {
    const prompt = this.promptBuilder.buildExecutiveSummaryPrompt(assessmentType, applicationName, organization, targetUrl);
    return this.generateAndParse(prompt, ExecutiveSummarySchema, "Executive Summary", projectId);
  }

  async generateMethodology(projectId: string, assessmentType: string, applicationName: string) {
    const prompt = this.promptBuilder.buildMethodologyPrompt(assessmentType, applicationName);
    return this.generateAndParse(prompt, MethodologySchema, "Methodology", projectId);
  }

  async generateConclusion(projectId: string, assessmentType: string, applicationName: string, organization: string, targetUrl: string) {
    const prompt = this.promptBuilder.buildConclusionPrompt(assessmentType, applicationName, organization, targetUrl);
    return this.generateAndParse(prompt, ConclusionSchema, "Conclusion", projectId);
  }

  async generateObservation(projectId: string, title: string, description: string, severity: string, cvss: string, cwe: string) {
    const prompt = this.promptBuilder.buildObservationPrompt(title, description, severity, cvss, cwe);
    return this.generateAndParse(prompt, ObservationSchema, "Observation", projectId);
  }

  async generateRecommendation(projectId: string, title: string, recommendation: string) {
    const prompt = this.promptBuilder.buildRecommendationPrompt(title, recommendation);
    return this.generateAndParse(prompt, RecommendationSchema, "Recommendation", projectId);
  }

  async generateBusinessImpact(projectId: string, title: string, severity: string, description: string) {
    const prompt = this.promptBuilder.buildBusinessImpactPrompt(title, severity, description);
    return this.generateAndParse(prompt, BusinessImpactSchema, "Business Impact", projectId);
  }

  async generateRiskSummary(projectId: string, assessmentType: string, applicationName: string, counts: { critical: number; high: number; medium: number; low: number }) {
    const prompt = this.promptBuilder.buildRiskSummaryPrompt(assessmentType, applicationName, counts);
    return this.generateAndParse(prompt, RiskSummarySchema, "Risk Summary", projectId);
  }
}
