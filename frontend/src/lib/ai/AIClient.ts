export interface AIClientConfig {
  baseUrl: string;
  model: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}

export class AIClient {
  private config: AIClientConfig;

  private systemPrompt = `You are a professional CERT-In penetration testing report writer.
You are NOT allowed to invent findings.
Only use the supplied JSON.
If a field is missing, write "Not Available".
Never mention vulnerabilities that are not supplied.
Never change severity.
Never change CVSS.
Never create URLs.
Never fabricate screenshots.
Never fabricate HTTP requests.
Never fabricate payloads.
Never fabricate evidence.
Rewrite only the language into professional consulting terminology.
Output valid JSON only.`;

  constructor(config?: Partial<AIClientConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || process.env.OLLAMA_URL || "http://127.0.0.1:11434",
      model: config?.model || process.env.OLLAMA_MODEL || "qwen2.5:3b",
      temperature: config?.temperature ?? 0.1,
      topP: config?.topP ?? 0.9,
      maxTokens: config?.maxTokens ?? 2048,
    };
  }

  /**
   * Generates a response from the AI provider.
   * Returns a raw JSON string.
   */
  async generate(prompt: string): Promise<string> {
    const provider = process.env.AI_PROVIDER || "ollama";

    if (provider !== "ollama") {
      throw new Error(`AI Provider ${provider} is not currently supported in Phase 1.`);
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          prompt: prompt,
          system: this.systemPrompt,
          stream: false,
          format: "json", // Forces JSON output in Ollama
          options: {
            temperature: this.config.temperature,
            top_p: this.config.topP,
            num_predict: this.config.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error: any) {
      // In case the service is down
      if (error.cause?.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
        throw new Error("AI Service Offline");
      }
      throw error;
    }
  }
}
