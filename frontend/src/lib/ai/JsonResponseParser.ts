import { z } from "zod";

export class JsonResponseParser {
  /**
   * Safely parses a JSON string, stripping any potential markdown formatting 
   * (e.g., ```json ... ```) that the AI might have erroneously included.
   */
  static parseRawJSON(raw: string): any {
    try {
      let cleaned = raw.trim();
      
      // Remove markdown code blocks if present
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json/, "");
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```/, "");
      }
      
      if (cleaned.endsWith("```")) {
        cleaned = cleaned.replace(/```$/, "");
      }
      
      return JSON.parse(cleaned.trim());
    } catch (error) {
      throw new Error(`Failed to parse AI response as JSON: ${error}`);
    }
  }

  /**
   * Parses and validates a response against a provided Zod schema.
   */
  static parseAndValidate<T>(raw: string, schema: z.ZodSchema<T>): T {
    const parsed = this.parseRawJSON(raw);
    
    const result = schema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`AI response did not match expected schema: ${result.error.message}`);
    }
    
    return result.data;
  }
}
