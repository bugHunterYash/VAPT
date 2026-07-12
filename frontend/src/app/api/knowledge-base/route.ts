import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    const findings = await (prisma as any).knowledgeBaseFinding.findMany({
      where: search ? {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } }
        ]
      } : undefined,
      orderBy: { title: 'asc' }
    });

    return NextResponse.json(findings);
  } catch (error: any) {
    console.error("Failed to fetch knowledge base findings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await verifyAuth(req);
    if (!session || session.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const data = await req.json();

    const newFinding = await (prisma as any).knowledgeBaseFinding.create({
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

    return NextResponse.json(newFinding, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create knowledge base finding:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
