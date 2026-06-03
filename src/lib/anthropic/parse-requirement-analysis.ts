import type { RequirementAnalysis } from "@/types";

import {
  ALLOWED_DATA_SOURCES,
  ALLOWED_WIDGETS,
} from "./constants";

interface RequirementAnalysisPayload {
  objectives: string[];
  dataSources: string[];
  widgets: string[];
  constraints: string[];
}

export function extractJsonFromModelText(text: string): unknown {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (fencedMatch?.[1]) {
    return JSON.parse(fencedMatch[1].trim());
  }

  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return JSON.parse(objectMatch[0]);
  }

  return JSON.parse(trimmed);
}

export function buildRequirementAnalysis(
  rawPrdText: string,
  payload: unknown,
): RequirementAnalysis {
  const parsed = validatePayload(payload);

  return {
    id: crypto.randomUUID(),
    rawRequirements: rawPrdText,
    objectives: parsed.objectives,
    dataSources: parsed.dataSources,
    widgets: parsed.widgets,
    constraints: parsed.constraints,
    createdAt: new Date().toISOString(),
  };
}

function validatePayload(payload: unknown): RequirementAnalysisPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Model response is not a JSON object");
  }

  const record = payload as Record<string, unknown>;

  const objectives = readStringArray(record.objectives, "objectives");
  const dataSources = readFilteredStringArray(
    record.dataSources,
    "dataSources",
    ALLOWED_DATA_SOURCES,
  );
  const widgets = readFilteredStringArray(
    record.widgets,
    "widgets",
    ALLOWED_WIDGETS,
  );
  const constraints = readStringArray(record.constraints, "constraints");

  return { objectives, dataSources, widgets, constraints };
}

function readStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error(`Field "${fieldName}" must be an array of strings`);
  }

  return value.map((item) => item.trim()).filter(Boolean);
}

function readFilteredStringArray<T extends string>(
  value: unknown,
  fieldName: string,
  allowed: readonly T[],
): T[] {
  const items = readStringArray(value, fieldName);
  const allowedSet = new Set<string>(allowed);

  return items.filter((item): item is T => allowedSet.has(item));
}
