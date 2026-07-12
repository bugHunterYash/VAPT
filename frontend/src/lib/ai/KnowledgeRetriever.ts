import { prisma } from "../prisma";

export interface KnowledgeFinding {
  title: string;
  description: string;
  remediation: string;
  businessImpact?: string;
  cwe?: string;
  cvss?: string;
}

export class KnowledgeRetriever {
  /**
   * Retrieves standardized finding data from the Knowledge Base.
   */
  static async retrieveFindingKnowledge(title: string): Promise<KnowledgeFinding | null> {
    try {
      const kbFinding = await (prisma as any).knowledgeBaseFinding.findUnique({
        where: { title }
      });

      if (!kbFinding) {
        return null;
      }

      return {
        title: kbFinding.title,
        description: kbFinding.description,
        remediation: kbFinding.recommendation,
        businessImpact: kbFinding.businessImpact,
        cwe: kbFinding.cwe,
        cvss: kbFinding.cvss,
      };
    } catch (error) {
      console.error(`Failed to retrieve knowledge for ${title}:`, error);
      return null;
    }
  }
}

