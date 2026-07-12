import { ReportGenerator, ReportGenerationContext } from "./ReportGenerator";

async function main() {
  // Setup env for test
  process.env.AI_PROVIDER = "ollama";
  process.env.OLLAMA_MODEL = "qwen2.5:3b";
  process.env.OLLAMA_URL = "http://127.0.0.1:11434";

  console.log("Starting AI Report Generation Test...");

  const generator = new ReportGenerator();

  const context: ReportGenerationContext = {
    projectId: "TEST-PROJ-123",
    assessmentType: "Web Application Penetration Testing",
    applicationName: "VMT Portal",
    organization: "Acme Corp",
    targetUrl: "https://vmt.acme.corp",
    findings: [
      {
        title: "Cross-Site Scripting (XSS)",
        description: "A reflected XSS was found on the search parameter.",
        severity: "High",
        cvss: "7.1",
        cwe: "CWE-79",
        recommendation: "Implement context-aware output encoding.",
      }
    ]
  };

  try {
    const report = await generator.generateReportSections(context);
    console.log("==== FINAL REPORT ====");
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

main();
