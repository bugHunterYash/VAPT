import { AIService } from "./AIService";

export interface ReportGenerationContext {
  projectId: string;
  assessmentType: string;
  applicationName: string;
  organization: string;
  targetUrl: string;
    findings: Array<{
      title: string;
      description: string;
      severity: string;
      cvss: string;
      cwe: string;
      owasp: string;
      recommendation: string;
      affectedUrls: string;
      businessImpact: string;
      stepsToReproduce: string;
      payload: string;
      references: string;
      evidenceUrls: string;
    }>;
}

export class ReportGenerator {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * Orchestrates generating the individual components of the report.
   * Does NOT generate the whole report in one prompt, but section by section.
   */
  async generateReportSections(context: ReportGenerationContext) {
    console.log(`Starting report generation for project: ${context.projectId}`);

    const [execSummary, methodology, conclusion] = await Promise.all([
      this.aiService.generateExecutiveSummary(
        context.projectId,
        context.assessmentType,
        context.applicationName,
        context.organization,
        context.targetUrl
      ),
      this.aiService.generateMethodology(
        context.projectId,
        context.assessmentType,
        context.applicationName
      ),
      this.aiService.generateConclusion(
        context.projectId,
        context.assessmentType,
        context.applicationName,
        context.organization,
        context.targetUrl
      )
    ]);

    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const f of context.findings) {
      if (f.severity === "Critical") counts.critical++;
      if (f.severity === "High") counts.high++;
      if (f.severity === "Medium") counts.medium++;
      if (f.severity === "Low") counts.low++;
    }

    const riskSummary = await this.aiService.generateRiskSummary(
      context.projectId,
      context.assessmentType,
      context.applicationName,
      counts
    );

    const generatedFindings = [];
    for (const finding of context.findings) {
      const observation = await this.aiService.generateObservation(
        context.projectId,
        finding.title,
        finding.description,
        finding.severity,
        finding.cvss,
        finding.cwe
      );

      const recommendation = await this.aiService.generateRecommendation(
        context.projectId,
        finding.title,
        finding.recommendation
      );

      const businessImpact = await this.aiService.generateBusinessImpact(
        context.projectId,
        finding.title,
        finding.severity,
        finding.businessImpact || finding.description
      );

      generatedFindings.push({
        title: finding.title,
        severity: finding.severity,
        cvss: finding.cvss,
        cwe: finding.cwe,
        owasp: finding.owasp,
        affectedUrls: finding.affectedUrls,
        stepsToReproduce: finding.stepsToReproduce,
        payload: finding.payload,
        references: finding.references,
        evidenceUrls: finding.evidenceUrls,
        observation: observation.observation,
        recommendation: recommendation.recommendation,
        businessImpact: businessImpact.businessImpact,
      });
    }

    return {
      executiveSummary: execSummary.executiveSummary,
      methodology: methodology.methodology,
      conclusion: conclusion.conclusion,
      riskSummary: riskSummary.riskSummary,
      findings: generatedFindings
    };
  }
}
