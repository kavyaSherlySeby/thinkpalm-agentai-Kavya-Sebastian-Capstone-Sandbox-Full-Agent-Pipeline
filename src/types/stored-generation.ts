import type { DashboardArchitecture } from "./dashboard-architecture";
import type { ExportOutput } from "./export";
import type { GeneratedComponent } from "./generated-component";
import type { PipelineExecution, PipelineRunResult, PipelineToolUsage } from "./pipeline";
import type { RequirementAnalysis } from "./requirement-analysis";
import type { ValidationResult } from "./validation";

/** Full pipeline outputs persisted with a generation (architecture stored separately). */
export interface PipelineGenerationSnapshot {
  analysis: RequirementAnalysis;
  components: GeneratedComponent[];
  export: ExportOutput;
  toolUsage: PipelineToolUsage[];
  execution: PipelineExecution;
  validation: ValidationResult;
}

export interface StoredGeneration {
  id: string;
  timestamp: string;
  dashboardType: string;
  widgets: string[];
  architecture: DashboardArchitecture;
  snapshot?: PipelineGenerationSnapshot;
}

export interface SaveGenerationInput {
  dashboardType: string;
  widgets: string[];
  architecture: DashboardArchitecture;
  snapshot?: PipelineGenerationSnapshot;
  id?: string;
  timestamp?: string;
}

export function buildPipelineRunResultFromStored(
  stored: StoredGeneration,
): PipelineRunResult | null {
  if (!stored.snapshot) {
    return null;
  }

  return {
    analysis: stored.snapshot.analysis,
    architecture: stored.architecture,
    components: stored.snapshot.components,
    export: stored.snapshot.export,
    toolUsage: stored.snapshot.toolUsage,
    execution: stored.snapshot.execution,
    validation: stored.snapshot.validation,
  };
}
