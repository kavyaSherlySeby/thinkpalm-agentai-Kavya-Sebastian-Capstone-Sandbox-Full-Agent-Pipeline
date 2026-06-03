import { ComponentGenerationAgent } from "@/agents/component-generation-agent";
import { DashboardPlanningAgent } from "@/agents/dashboard-planning-agent";
import { RequirementAnalysisAgent } from "@/agents/requirement-analysis-agent";
import { SessionMemory } from "@/memory/session-memory";
import type {
  AgentToolUsage,
  DashboardArchitecture,
  ExportOutput,
  GeneratedComponent,
  PipelineExecution,
  PipelineRunOptions,
  PipelineRunResult,
  PipelineStageExecution,
  PipelineStageId,
  PipelineToolUsage,
  RequirementAnalysis,
  ValidationResult,
} from "@/types";

const PIPELINE_STAGES: readonly PipelineStageId[] = [
  "requirement_analysis",
  "planning",
  "component_generation",
];

export interface PipelineAgents {
  readonly requirement: RequirementAnalysisAgent;
  readonly planning: DashboardPlanningAgent;
  readonly component: ComponentGenerationAgent;
}

export function createInitialPipelineExecution(): PipelineExecution {
  return {
    pipelineId: crypto.randomUUID(),
    status: "running",
    startedAt: new Date().toISOString(),
    stages: PIPELINE_STAGES.map(
      (stage): PipelineStageExecution => ({
        stage,
        status: "pending",
      }),
    ),
  };
}

export class PipelineService {
  private readonly agents: PipelineAgents;
  private readonly sessionMemory?: SessionMemory;

  constructor(
    agents?: Partial<PipelineAgents>,
    sessionMemory?: SessionMemory,
  ) {
    this.agents = {
      requirement: agents?.requirement ?? new RequirementAnalysisAgent(),
      planning: agents?.planning ?? new DashboardPlanningAgent(),
      component: agents?.component ?? new ComponentGenerationAgent(),
    };
    this.sessionMemory = sessionMemory;
  }

  async run(
    requirements: string,
    options: PipelineRunOptions = {},
  ): Promise<PipelineRunResult> {
    const execution = createInitialPipelineExecution();
    const toolUsage: PipelineToolUsage[] = [];

    this.sessionMemory?.setPrdDraft(requirements);
    this.notifyProgress(execution, options.onProgress);

    let analysis: RequirementAnalysis | undefined;
    let architecture: DashboardArchitecture | undefined;
    let components: GeneratedComponent[] | undefined;
    let validation: ValidationResult | undefined;
    let exportOutput: ExportOutput | undefined;

    try {
      const requirementResult = await this.executeStage(
        execution,
        "requirement_analysis",
        async () => this.agents.requirement.analyze(requirements),
        options.onProgress,
      );
      analysis = requirementResult.analysis;
      this.appendToolUsage(
        toolUsage,
        "requirement_analysis",
        requirementResult.toolUsage,
        options,
      );

      const planningResult = await this.executeStage(
        execution,
        "planning",
        async () => this.agents.planning.plan(analysis!),
        options.onProgress,
      );
      architecture = planningResult.architecture;
      validation = planningResult.validation;
      this.appendToolUsage(
        toolUsage,
        "planning",
        planningResult.toolUsage,
        options,
      );

      const componentResult = await this.executeStage(
        execution,
        "component_generation",
        async () => this.agents.component.generate(architecture!),
        options.onProgress,
      );
      components = componentResult.components;
      exportOutput = componentResult.export;
      this.appendToolUsage(
        toolUsage,
        "component_generation",
        componentResult.toolUsage,
        options,
      );

      execution.status = "completed";
      execution.completedAt = new Date().toISOString();
      this.notifyProgress(execution, options.onProgress);

      const result: PipelineRunResult = {
        analysis: analysis!,
        architecture: architecture!,
        components: components!,
        validation: validation!,
        export: exportOutput!,
        toolUsage,
        execution: cloneExecution(execution),
      };

      this.sessionMemory?.setCurrentRun(result);
      return result;
    } catch (error) {
      execution.status = "failed";
      execution.completedAt = new Date().toISOString();
      execution.error = toErrorMessage(error);
      this.notifyProgress(execution, options.onProgress);
      throw error;
    }
  }

  private appendToolUsage(
    toolUsage: PipelineToolUsage[],
    stage: PipelineStageId,
    usages: AgentToolUsage[],
    options: PipelineRunOptions,
  ): void {
    const tagged = this.tagToolUsage(stage, usages);
    toolUsage.push(...tagged);
    for (const entry of tagged) {
      options.onToolUsage?.(entry);
    }
  }

  private tagToolUsage(
    stage: PipelineStageId,
    usages: AgentToolUsage[],
  ): PipelineToolUsage[] {
    return usages.map((usage) => ({ stage, ...usage }));
  }

  private notifyProgress(
    execution: PipelineExecution,
    onProgress?: PipelineRunOptions["onProgress"],
  ): void {
    onProgress?.(cloneExecution(execution));
  }

  private async executeStage<T>(
    execution: PipelineExecution,
    stageId: PipelineStageId,
    operation: () => Promise<T>,
    onProgress?: PipelineRunOptions["onProgress"],
  ): Promise<T> {
    const stage = execution.stages.find((entry) => entry.stage === stageId);

    if (!stage) {
      throw new Error(`Unknown pipeline stage: ${stageId}`);
    }

    stage.status = "running";
    stage.startedAt = new Date().toISOString();
    this.notifyProgress(execution, onProgress);

    try {
      const result = await operation();
      stage.status = "completed";
      stage.completedAt = new Date().toISOString();
      this.notifyProgress(execution, onProgress);
      return result;
    } catch (error) {
      stage.status = "failed";
      stage.completedAt = new Date().toISOString();
      stage.error = toErrorMessage(error);
      this.notifyProgress(execution, onProgress);
      throw error;
    }
  }
}

function cloneExecution(execution: PipelineExecution): PipelineExecution {
  return {
    ...execution,
    stages: execution.stages.map((stage) => ({ ...stage })),
  };
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
