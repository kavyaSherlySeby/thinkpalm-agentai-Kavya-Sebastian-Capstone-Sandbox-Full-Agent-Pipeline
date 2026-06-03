import type { AgentToolUsage } from "./agent-tool-usage";
import type { DashboardArchitecture } from "./dashboard-architecture";
import type { ExportOutput } from "./export";
import type { GeneratedComponent } from "./generated-component";
import type { RequirementAnalysis } from "./requirement-analysis";
import type { ValidationResult } from "./validation";

export type PipelineStageId =
  | "requirement_analysis"
  | "planning"
  | "component_generation";

export type PipelineStageStatus = "pending" | "running" | "completed" | "failed";

export interface PipelineToolUsage extends AgentToolUsage {
  stage: PipelineStageId;
}

export type PipelineExecutionStatus = "running" | "completed" | "failed";

export interface PipelineStageExecution {
  stage: PipelineStageId;
  status: PipelineStageStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface PipelineExecution {
  pipelineId: string;
  status: PipelineExecutionStatus;
  stages: PipelineStageExecution[];
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface PipelineRunResult {
  analysis: RequirementAnalysis;
  architecture: DashboardArchitecture;
  components: GeneratedComponent[];
  validation: ValidationResult;
  export: ExportOutput;
  toolUsage: PipelineToolUsage[];
  execution: PipelineExecution;
}

export type PipelineProgressCallback = (execution: PipelineExecution) => void;

export type PipelineToolUsageCallback = (usage: PipelineToolUsage) => void;

export interface PipelineRunOptions {
  onProgress?: PipelineProgressCallback;
  onToolUsage?: PipelineToolUsageCallback;
}
