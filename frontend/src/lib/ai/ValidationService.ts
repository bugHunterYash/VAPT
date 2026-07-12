export interface ValidationContext {
  project: {
    status: string;
  };
  checklistComplete: boolean;
  reviewerApproved: boolean;
  findings: Array<{
    status: string;
    evidenceUrls?: string | null;
  }>;
}

export class ValidationService {
  /**
   * Validates if the project is ready for AI Report generation.
   * Project must be Approved.
   * Checklist must be complete.
   * Reviewer must have approved.
   * All findings must have evidence and be in a valid state.
   */
  static validateForReportGeneration(context: ValidationContext): {
    valid: boolean;
    reason?: string;
  } {
    if (context.project.status !== "Approved" && context.project.status !== "Completed") {
      return { valid: false, reason: "Project must be Approved or Completed to generate a report." };
    }

    if (!context.checklistComplete) {
      return { valid: false, reason: "Project checklist must be fully completed." };
    }

    if (!context.reviewerApproved) {
      return { valid: false, reason: "Project must be approved by the reviewer." };
    }

    for (const finding of context.findings) {
      if (finding.status === "Open" && (!finding.evidenceUrls || finding.evidenceUrls.trim() === "")) {
        return { valid: false, reason: "All Open findings must have associated evidence." };
      }
    }

    return { valid: true };
  }
}
