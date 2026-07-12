import fs from "fs";
import path from "path";

export class PromptBuilder {
  private templatesDir = path.join(process.cwd(), "src/lib/ai/prompts");

  /**
   * Reads a template file from the prompts directory.
   */
  private getTemplate(templateName: string): string {
    const filePath = path.join(this.templatesDir, `${templateName}.txt`);
    try {
      return fs.readFileSync(filePath, "utf-8");
    } catch (error) {
      throw new Error(`Failed to read prompt template '${templateName}': ${error}`);
    }
  }

  /**
   * Replaces variables in the template string with provided values.
   */
  private populateTemplate(template: string, variables: Record<string, string | number>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(placeholder, String(value));
    }
    return result;
  }

  buildExecutiveSummaryPrompt(assessmentType: string, applicationName: string, organization: string, targetUrl: string): string {
    const template = this.getTemplate("executive_summary");
    return this.populateTemplate(template, {
      ASSESSMENT_TYPE: assessmentType,
      APPLICATION_NAME: applicationName,
      ORGANIZATION: organization,
      TARGET_URL: targetUrl
    });
  }

  buildMethodologyPrompt(assessmentType: string, applicationName: string): string {
    const template = this.getTemplate("methodology");
    return this.populateTemplate(template, {
      ASSESSMENT_TYPE: assessmentType,
      APPLICATION_NAME: applicationName
    });
  }

  buildConclusionPrompt(assessmentType: string, applicationName: string, organization: string, targetUrl: string): string {
    const template = this.getTemplate("conclusion");
    return this.populateTemplate(template, {
      ASSESSMENT_TYPE: assessmentType,
      APPLICATION_NAME: applicationName,
      ORGANIZATION: organization,
      TARGET_URL: targetUrl
    });
  }

  buildObservationPrompt(title: string, description: string, severity: string, cvss: string, cwe: string): string {
    const template = this.getTemplate("observation");
    return this.populateTemplate(template, {
      FINDING_TITLE: title,
      FINDING_DESCRIPTION: description || "Not Provided",
      FINDING_SEVERITY: severity,
      FINDING_CVSS: cvss || "Not Provided",
      FINDING_CWE: cwe || "Not Provided"
    });
  }

  buildRecommendationPrompt(title: string, recommendation: string): string {
    const template = this.getTemplate("recommendation");
    return this.populateTemplate(template, {
      FINDING_TITLE: title,
      FINDING_RECOMMENDATION: recommendation || "Not Provided"
    });
  }

  buildBusinessImpactPrompt(title: string, severity: string, description: string): string {
    const template = this.getTemplate("business_impact");
    return this.populateTemplate(template, {
      FINDING_TITLE: title,
      FINDING_SEVERITY: severity,
      FINDING_DESCRIPTION: description || "Not Provided"
    });
  }

  buildRiskSummaryPrompt(assessmentType: string, applicationName: string, counts: { critical: number; high: number; medium: number; low: number }): string {
    const template = this.getTemplate("risk_summary");
    return this.populateTemplate(template, {
      ASSESSMENT_TYPE: assessmentType,
      APPLICATION_NAME: applicationName,
      CRITICAL_COUNT: counts.critical,
      HIGH_COUNT: counts.high,
      MEDIUM_COUNT: counts.medium,
      LOW_COUNT: counts.low
    });
  }
}
