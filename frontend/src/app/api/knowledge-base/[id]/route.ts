import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifyAuth(req);
    if (!session || session.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    const updatedFinding = await (prisma as any).knowledgeBaseFinding.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        severity: data.severity,
        cvss: data.cvss || null,
        cwe: data.cwe || null,
        owasp: data.owasp || null,
        recommendation: data.recommendation,
        businessImpact: data.businessImpact || null,
      }
    });

    return NextResponse.json(updatedFinding);
  } catch (error: any) {
    console.error(`Failed to update knowledge base finding ${params.id}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await verifyAuth(req);
    if (!session || session.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const { id } = params;

    await (prisma as any).knowledgeBaseFinding.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Failed to delete knowledge base finding ${params.id}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
