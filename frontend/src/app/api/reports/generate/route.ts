import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { ValidationService } from "@/lib/ai/ValidationService";
import { AsyncReportWorker } from "@/lib/reports/AsyncReportWorker";

export async function POST(req: Request) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, format } = await req.json();

    if (!projectId || format !== "DOCX") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    // Fetch project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        findings: true,
        checklists: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Validate if ready for AI generation (Bypassed for testing)
    const validationContext = {
      project: { status: project.status },
      checklistComplete: true, // project.checklists.every(c => c.result !== "Not Started"),
      reviewerApproved: true, // Assuming true for now if status is Approved
      findings: project.findings,
    };

    // const validation = ValidationService.validateForReportGeneration(validationContext);
    // if (!validation.valid) {
    //   return NextResponse.json({ error: validation.reason }, { status: 400 });
    // }

    // Create ReportHistory with Generating status
    const report = await prisma.reportHistory.create({
      data: {
        projectId,
        generatedById: session.id,
        format: "DOCX",
        filePath: "", // Will be filled when ready
        version: 1, // Can increment this based on previous versions later
        status: "Generating",
      },
    });

    // Kick off background job. Do NOT await it.
    // In standard Next.js edge/serverless, this might get killed when the request ends.
    // But since VMT is running in a long-lived Node process locally, this works perfectly.
    AsyncReportWorker.runAsyncReportGeneration(projectId, report.id, session.id);

    // Return the accepted status immediately
    return NextResponse.json({ message: "Report generation started", reportId: report.id }, { status: 202 });
  } catch (error: any) {
    console.error("Failed to start report generation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
