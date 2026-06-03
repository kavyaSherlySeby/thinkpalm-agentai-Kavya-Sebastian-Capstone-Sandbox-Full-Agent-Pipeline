import { NextResponse } from "next/server";

import { analyzeRequirementsWithAnthropic } from "@/lib/anthropic/analyze-requirements";
import { ClaudeApiError } from "@/lib/anthropic/claude-api-error";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be a JSON object" },
        { status: 400 },
      );
    }

    const record = body as Record<string, unknown>;
    const rawPrdText =
      typeof record.rawPrdText === "string" ? record.rawPrdText : "";

    const result = await analyzeRequirementsWithAnthropic(rawPrdText, {
      model: typeof record.model === "string" ? record.model : undefined,
      maxTokens:
        typeof record.maxTokens === "number" ? record.maxTokens : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ClaudeApiError) {
      return NextResponse.json(
        {
          error: error.message,
          retryable: error.isRetryable,
        },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred while analyzing the PRD" },
      { status: 500 },
    );
  }
}
