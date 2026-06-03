import { ClaudeApiError } from "@/lib/anthropic/claude-api-error";
import type {
  ClaudeAnalyzeRequest,
  ClaudeAnalyzeResult,
  ClaudeToolConfig,
} from "@/types";

export { ClaudeApiError } from "@/lib/anthropic/claude-api-error";

/**
 * Browser-safe Claude client. Calls the Next.js API route which runs the Anthropic SDK server-side.
 */
export class ClaudeTool {
  private readonly config: ClaudeToolConfig;

  constructor(config: ClaudeToolConfig = {}) {
    this.config = config;
  }

  async analyzePRD(
    rawPrdText: string,
    request?: Partial<ClaudeAnalyzeRequest>,
  ): Promise<ClaudeAnalyzeResult> {
    const prdText = request?.rawPrdText ?? rawPrdText;
    return this.analyzeViaApiRoute(prdText);
  }

  private async analyzeViaApiRoute(
    rawPrdText: string,
  ): Promise<ClaudeAnalyzeResult> {
    let response: Response;

    try {
      response = await fetch("/api/analyze-prd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawPrdText,
          model: this.config.model,
          maxTokens: this.config.maxTokens,
        }),
      });
    } catch {
      throw new ClaudeApiError(
        "Unable to reach the analysis API. Check your network connection.",
        503,
        true,
      );
    }

    let payload: unknown;

    try {
      payload = await response.json();
    } catch {
      throw new ClaudeApiError("Analysis API returned an invalid response", 502);
    }

    if (!response.ok) {
      const record =
        payload && typeof payload === "object"
          ? (payload as Record<string, unknown>)
          : null;

      const errorMessage =
        typeof record?.error === "string"
          ? record.error
          : `Analysis API failed with status ${response.status}`;

      const retryable = record?.retryable === true;

      throw new ClaudeApiError(errorMessage, response.status, retryable);
    }

    return payload as ClaudeAnalyzeResult;
  }
}
