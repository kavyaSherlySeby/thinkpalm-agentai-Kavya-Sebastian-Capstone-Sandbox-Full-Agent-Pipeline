import type { RequirementAnalysis } from "./requirement-analysis";

export interface ClaudeToolConfig {
  apiKey?: string;
  /** Model id, e.g. claude-sonnet-4-20250514 */
  model?: string;
  /** API base URL override for proxies or testing */
  baseUrl?: string;
  maxTokens?: number;
}

export type ClaudeResponseSource = "anthropic" | "fallback";

export interface ClaudeAnalyzeResult {
  analysis: RequirementAnalysis;
  source: ClaudeResponseSource;
  model?: string;
  rawResponse?: unknown;
}

export interface ClaudeAnalyzeRequest {
  rawPrdText: string;
}
