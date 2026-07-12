import { NextResponse } from 'next/server';
import { AIClient } from '@/lib/ai/AIClient';
import { JsonResponseParser } from '@/lib/ai/JsonResponseParser';
import { z } from 'zod';

const AutocompleteSchema = z.object({
  description: z.string(),
  owasp: z.string(),
  cwe: z.string(),
  mitigation: z.string()
});

export async function POST(req: Request) {
  try {
    const { vulnerabilityName } = await req.json();

    if (!vulnerabilityName) {
      return NextResponse.json({ error: 'vulnerabilityName is required' }, { status: 400 });
    }

    const aiClient = new AIClient();

    const prompt = `You are a professional VAPT Report Assistant.
You are NOT a penetration tester.
Your task is only to assist in writing a professional report.

Rules:
- Never invent vulnerabilities.
- Never invent URLs.
- Never invent screenshots.
- Never invent severity.
- Never invent evidence.
- Never change user input.

Input:
Vulnerability Name: "${vulnerabilityName}"

Output:
Return ONLY
- Description
- OWASP Mapping (Human readable only, e.g. "Broken Access Control", do not include "A01:2021")
- CWE ID (e.g. "CWE-284")
- Mitigation

Do not generate CVSS.
Do not generate HTTP Requests.
Do not generate HTTP Responses.
Do not generate Steps to Reproduce.
Do not generate References.

Return JSON only matching this schema exactly:
{
  "description": "...",
  "owasp": "...",
  "cwe": "...",
  "mitigation": "..."
}`;

    const rawResponse = await aiClient.generate(prompt);
    
    // Attempt to parse the JSON
    const parsed = JsonResponseParser.parseAndValidate(rawResponse, AutocompleteSchema);

    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error('Error generating autocomplete:', error);
    return NextResponse.json({ error: error.message || 'Failed to autocomplete finding' }, { status: 500 });
  }
}
