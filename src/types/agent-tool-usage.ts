import type { ExportOutput } from "./export";
import type { ValidationResult } from "./validation";
import type { DashboardArchitecture } from "./dashboard-architecture";
import type { GeneratedComponent } from "./generated-component";
import type { RequirementAnalysis } from "./requirement-analysis";
import type { ClaudeAnalyzeResult } from "./claude";

export type AgentToolName = "ClaudeTool" | "ValidatorTool" | "ExportTool";

export interface AgentToolUsage {
  tool: AgentToolName;
  action: string;
  summary: string;
  output?: unknown;
}

export interface RequirementAnalysisAgentResult {
  analysis: RequirementAnalysis;
  toolUsage: AgentToolUsage[];
}

export interface PlanningAgentResult {
  architecture: DashboardArchitecture;
  validation: ValidationResult;
  toolUsage: AgentToolUsage[];
}

export interface ComponentGenerationAgentResult {
  components: GeneratedComponent[];
  export: ExportOutput;
  toolUsage: AgentToolUsage[];
}

export interface ClaudeToolUsageOutput {
  source: ClaudeAnalyzeResult["source"];
  model?: string;
  analysisId: string;
  error?: string;
}

export interface ValidatorToolUsageOutput {
  valid: boolean;
  issueCount: number;
}

export interface ExportToolUsageOutput {
  filename: string;
  componentCount: number;
  contentLength: number;
}
