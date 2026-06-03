import Anthropic from "@anthropic-ai/sdk";

import type { ClaudeAnalyzeResult, ClaudeToolConfig } from "@/types";

import {
  ANTHROPIC_API_KEY_ENV,
  DEFAULT_ANTHROPIC_MODEL,
} from "./constants";
import { ClaudeApiError } from "./claude-api-error";
import {
  buildRequirementAnalysis,
  extractJsonFromModelText,
} from "./parse-requirement-analysis";

const ANALYSIS_SYSTEM_PROMPT = `You are an IoT dashboard requirements analyst.
Read the product requirements document (PRD) and respond with ONLY valid JSON (no markdown prose outside the JSON).

Use this exact shape:
{
  "objectives": string[],
  "dataSources": string[],
  "widgets": string[],
  "constraints": string[]
}

Rules:
- "dataSources" values must be chosen from: temperature, fuel, gps, alerts, sensors
- "widgets" values must be chosen from: temperature-chart, fuel-gauge, location-map, alerts-panel, sensor-grid
- Map PRD needs to the closest allowed dataSources and widgets
- "constraints" captures non-functional requirements (real-time, mobile, compliance, etc.)
- If the PRD is vague, infer reasonable IoT fleet dashboard defaults`;

function resolveApiKey(config: ClaudeToolConfig): string {
  const apiKey = config.apiKey ?? process.env[ANTHROPIC_API_KEY_ENV];

  if (!apiKey?.trim()) {
    throw new ClaudeApiError(
      `${ANTHROPIC_API_KEY_ENV} is not configured. Add it to your environment variables.`,
      503,
    );
  }

  return apiKey.trim();
}

function resolveModel(config: ClaudeToolConfig): string {
  return config.model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_ANTHROPIC_MODEL;
}

export async function analyzeRequirementsWithAnthropic(
  rawPrdText: string,
  config: ClaudeToolConfig = {},
): Promise<ClaudeAnalyzeResult> {
  const trimmedPrd = rawPrdText.trim();

  if (!trimmedPrd) {
    throw new ClaudeApiError("PRD text is required", 400);
  }

  const apiKey = resolveApiKey(config);
  const model = resolveModel(config);
  const maxTokens = config.maxTokens ?? 1024;

  const client = new Anthropic({
    apiKey,
    baseURL: config.baseUrl,
  });

  try {
    const message = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyze this PRD:\n\n${trimmedPrd}`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");

    if (!textBlock || textBlock.type !== "text") {
      throw new ClaudeApiError("Anthropic returned no text content", 502);
    }

    let payload: unknown;

    try {
      payload = extractJsonFromModelText(textBlock.text);
    } catch {
      throw new ClaudeApiError(
        "Failed to parse structured RequirementAnalysis JSON from model response",
        502,
      );
    }

    const analysis = buildRequirementAnalysis(trimmedPrd, payload);

    return {
      analysis,
      source: "anthropic",
      model,
      rawResponse: message,
    };
  } catch (error) {
    if (error instanceof ClaudeApiError) {
      throw error;
    }

    if (error instanceof Anthropic.APIError) {
      const statusCode = error.status ?? 502;
      throw new ClaudeApiError(
        error.message || "Anthropic API request failed",
        statusCode,
        statusCode === 429 || statusCode >= 500,
      );
    }

    throw new ClaudeApiError(
      error instanceof Error ? error.message : "Unexpected Anthropic client error",
      500,
    );
  }
}
