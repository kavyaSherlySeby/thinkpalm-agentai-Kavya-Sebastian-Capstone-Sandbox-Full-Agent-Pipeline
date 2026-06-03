"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  MemoryService,
  SessionMemory,
  buildPipelineRunResultFromStored,
} from "@/memory";
import { PipelineService, createInitialPipelineExecution } from "@/services";
import { ExportTool } from "@/tools/export-tool";
import type {
  ComponentPlan,
  DashboardArchitecture,
  DashboardSectionId,
  GeneratedComponent,
  PipelineExecution,
  PipelineRunResult,
  PipelineStageExecution,
  PipelineStageStatus,
  PipelineToolUsage,
  RequirementAnalysis,
  StoredGeneration,
} from "@/types";

const DEFAULT_PRD = `Build a marine monitoring dashboard.

Show:
- Engine temperature
- Fuel level
- GPS location
- Active alarms
- Sensor health`;

const STAGE_LABELS: Record<string, string> = {
  requirement_analysis: "Requirement Analysis Agent",
  planning: "Dashboard Planning Agent",
  component_generation: "Component Generation Agent",
};

const SECTION_LABELS: Record<DashboardSectionId, string> = {
  header: "Header",
  kpiCards: "KPI Cards",
  charts: "Charts",
  alerts: "Alerts",
};

const STATUS_LABELS: Record<PipelineStageStatus, string> = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};

const AGENT_STAGE_ORDER: PipelineStageExecution["stage"][] = [
  "requirement_analysis",
  "planning",
  "component_generation",
];

function calculateProgressPercent(execution: PipelineExecution | null): number {
  if (!execution) {
    return 0;
  }

  const stageWeight: Record<PipelineStageStatus, number> = {
    pending: 0,
    running: 0.5,
    completed: 1,
    failed: 1,
  };

  const totalWeight = execution.stages.reduce(
    (sum, stage) => sum + stageWeight[stage.status],
    0,
  );

  return Math.round((totalWeight / execution.stages.length) * 100);
}

function countCompletedStages(execution: PipelineExecution | null): number {
  return (
    execution?.stages.filter((stage) => stage.status === "completed").length ?? 0
  );
}

function Card({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 ${className}`}
    >
      <header className="mb-4">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-900 uppercase dark:text-zinc-100">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
      {message}
    </p>
  );
}

function JsonPreview({ data }: { data: unknown }) {
  return (
    <pre className="max-h-80 overflow-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-emerald-400">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function StatusBadge({ status }: { status: PipelineStageStatus | string }) {
  const normalized = status as PipelineStageStatus;
  const styles: Record<string, string> = {
    pending:
      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    running:
      "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    completed:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    failed: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[normalized] ?? styles.pending}`}
    >
      {normalized === "running" ? (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" />
      ) : null}
      {STATUS_LABELS[normalized] ?? status}
    </span>
  );
}

function AgentActivityPanel({
  execution,
  isGenerating,
}: {
  execution: PipelineExecution | null;
  isGenerating: boolean;
}) {
  if (!execution) {
    return <EmptyState message="Run the pipeline to see agent activity." />;
  }

  const progressPercent = calculateProgressPercent(execution);
  const completedCount = countCompletedStages(execution);
  const totalStages = execution.stages.length;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Pipeline progress</span>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {completedCount} / {totalStages} agents · {progressPercent}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              execution.status === "failed"
                ? "bg-red-500"
                : progressPercent === 100
                  ? "bg-emerald-500"
                  : "bg-sky-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {isGenerating ? (
          <p className="mt-2 text-xs text-sky-600 dark:text-sky-400">
            Executing agent pipeline…
          </p>
        ) : execution.status === "completed" ? (
          <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
            All agents completed.
          </p>
        ) : execution.status === "failed" ? (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            {execution.error ?? "Pipeline failed."}
          </p>
        ) : null}
      </div>

      <ul className="space-y-3">
        {AGENT_STAGE_ORDER.map((stageId) => {
          const stage = execution.stages.find(
            (entry) => entry.stage === stageId,
          );
          if (!stage) {
            return null;
          }

          const isActive = stage.status === "running";
          const isDone = stage.status === "completed";

          return (
            <li
              key={stage.stage}
              className={`rounded-lg border px-3 py-3 transition-colors ${
                isActive
                  ? "border-sky-300 bg-sky-50 dark:border-sky-700 dark:bg-sky-950/40"
                  : isDone
                    ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                    : "border-zinc-100 dark:border-zinc-800"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {STAGE_LABELS[stage.stage] ?? stage.stage}
                </span>
                <StatusBadge status={stage.status} />
              </div>
              {stage.startedAt ? (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {stage.status === "running"
                    ? `Started ${new Date(stage.startedAt).toLocaleTimeString()}`
                    : stage.completedAt
                      ? `Finished ${new Date(stage.completedAt).toLocaleTimeString()}`
                      : null}
                </p>
              ) : (
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  Waiting to start
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function groupPlansBySection(
  plans: ComponentPlan[],
): Record<DashboardSectionId, ComponentPlan[]> {
  const grouped: Record<DashboardSectionId, ComponentPlan[]> = {
    header: [],
    kpiCards: [],
    charts: [],
    alerts: [],
  };

  for (const plan of plans) {
    grouped[plan.sectionId].push(plan);
  }

  return grouped;
}

function ToolUsageList({ usages }: { usages: PipelineToolUsage[] }) {
  return (
    <ul className="space-y-3">
      {usages.map((usage, index) => (
        <li
          key={`${usage.stage}-${usage.tool}-${index}`}
          className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
              {usage.tool}
            </span>
            <span className="text-xs text-zinc-400">·</span>
            <span className="text-xs text-zinc-500 capitalize dark:text-zinc-400">
              {usage.stage.replace(/_/g, " ")}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {usage.action}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {usage.summary}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function DashboardArchitect() {
  const sessionMemory = useMemo(() => new SessionMemory(), []);
  const [prdText, setPrdText] = useState(
    () => sessionMemory.getPrdDraft() || DEFAULT_PRD,
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PipelineRunResult | null>(null);
  const [execution, setExecution] = useState<PipelineExecution | null>(null);
  const [liveToolUsage, setLiveToolUsage] = useState<PipelineToolUsage[]>([]);
  const [history, setHistory] = useState<StoredGeneration[]>([]);
  const [loadedSnapshot, setLoadedSnapshot] = useState<StoredGeneration | null>(
    null,
  );

  const memoryService = useMemo(() => new MemoryService(), []);
  const pipelineService = useMemo(
    () => new PipelineService(undefined, sessionMemory),
    [sessionMemory],
  );
  const exportTool = useMemo(() => new ExportTool(), []);

  const refreshHistory = useCallback(() => {
    setHistory(memoryService.getHistory());
  }, [memoryService]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const displayArchitecture: DashboardArchitecture | null =
    result?.architecture ?? loadedSnapshot?.architecture ?? null;

  const displayAnalysis: RequirementAnalysis | null = result?.analysis ?? null;

  const displayComponents: GeneratedComponent[] = result?.components ?? [];

  const displayToolUsage: PipelineToolUsage[] = isGenerating
    ? liveToolUsage
    : (result?.toolUsage ?? liveToolUsage);

  const componentTree = useMemo(() => {
    if (!displayArchitecture) {
      return null;
    }
    return groupPlansBySection(displayArchitecture.componentPlan);
  }, [displayArchitecture]);

  const activeExecution = execution ?? result?.execution ?? null;
  const progressPercent = calculateProgressPercent(activeExecution);

  const handleGenerate = async () => {
    const trimmed = prdText.trim();
    if (!trimmed) {
      setError("Enter a product requirements document before generating.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setLoadedSnapshot(null);
    setResult(null);
    setLiveToolUsage([]);
    setExecution(createInitialPipelineExecution());
    sessionMemory.setPrdDraft(trimmed);

    try {
      const pipelineResult = await pipelineService.run(trimmed, {
        onProgress: setExecution,
        onToolUsage: (usage) =>
          setLiveToolUsage((previous) => [...previous, usage]),
      });
      setResult(pipelineResult);
      setExecution(pipelineResult.execution);

      memoryService.saveGeneration({
        dashboardType: pipelineResult.architecture.name,
        widgets: pipelineResult.analysis.widgets,
        architecture: pipelineResult.architecture,
        snapshot: {
          analysis: pipelineResult.analysis,
          components: pipelineResult.components,
          export: pipelineResult.export,
          toolUsage: pipelineResult.toolUsage,
          execution: pipelineResult.execution,
          validation: pipelineResult.validation,
        },
      });

      refreshHistory();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Pipeline execution failed.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadGeneration = (generationId: string) => {
    const loaded = memoryService.loadGeneration(generationId);
    if (!loaded) {
      return;
    }

    const restored = buildPipelineRunResultFromStored(loaded);

    if (restored) {
      setResult(restored);
      setExecution(restored.execution);
      setLiveToolUsage(restored.toolUsage);
      setPrdText(restored.analysis.rawRequirements);
      sessionMemory.setPrdDraft(restored.analysis.rawRequirements);
      sessionMemory.setCurrentRun(restored);
    } else {
      setResult(null);
      setExecution(null);
      setLiveToolUsage([]);
    }

    setLoadedSnapshot(loaded);
    setError(null);
  };

  const handlePrdChange = (value: string) => {
    setPrdText(value);
    sessionMemory.setPrdDraft(value);
  };

  const handleDownload = () => {
    if (!result?.components.length) {
      return;
    }
    exportTool.download(result.components);
  };

  return (
    <div className="min-h-full bg-zinc-100 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="text-sm font-medium text-sky-600 dark:text-sky-400">
            Capstone Sandbox
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Intelligent IoT Dashboard Architect
          </h1>
          <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
            Describe your fleet dashboard in natural language. Agents analyze
            requirements, plan architecture, and generate component code.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Column 1 — input & controls */}
          <div className="flex flex-col gap-6 lg:col-span-4">
            <Card
              title="PRD Input"
              description="Product requirements for the dashboard pipeline"
            >
              <textarea
                value={prdText}
                onChange={(event) => handlePrdChange(event.target.value)}
                rows={12}
                placeholder="Describe sensors, KPIs, charts, and alerts…"
                className="w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-900 outline-none ring-sky-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </Card>

            <Card title="Generate">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating
                  ? `Running pipeline… ${progressPercent}%`
                  : "Generate Dashboard"}
              </button>
              {isGenerating && activeExecution ? (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              ) : null}
              {error ? (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
                  {error}
                </p>
              ) : null}
              {activeExecution?.status === "completed" && !isGenerating ? (
                <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
                  Pipeline completed successfully.
                </p>
              ) : null}
            </Card>

            <Card
              title="Agent Activity"
              description="Pending → Running → Completed per agent"
            >
              <AgentActivityPanel
                execution={activeExecution}
                isGenerating={isGenerating}
              />
            </Card>

            <Card
              title="Tool Activity"
              description="Claude, validator, and export tool calls (live during run)"
            >
              {displayToolUsage.length > 0 ? (
                <ToolUsageList usages={displayToolUsage} />
              ) : isGenerating ? (
                <EmptyState message="Waiting for the first tool call…" />
              ) : (
                <EmptyState message="Tool usage appears when the pipeline runs." />
              )}
            </Card>
          </div>

          {/* Column 2 — outputs */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            <div className="grid gap-6 md:grid-cols-2">
              <Card title="Requirement Analysis">
                {displayAnalysis ? (
                  <JsonPreview data={displayAnalysis} />
                ) : loadedSnapshot && !result ? (
                  <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <p>Loaded legacy entry — analysis not stored. Re-run Generate to refresh.</p>
                    <p>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        Widgets:
                      </span>{" "}
                      {loadedSnapshot.widgets.join(", ") || "none"}
                    </p>
                  </div>
                ) : (
                  <EmptyState message="No requirement analysis yet." />
                )}
              </Card>

              <Card title="Dashboard Architecture">
                {displayArchitecture ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {displayArchitecture.name}
                      </h3>
                      {result?.validation ? (
                        <StatusBadge
                          status={
                            result.validation.valid ? "completed" : "failed"
                          }
                        />
                      ) : null}
                    </div>
                    <JsonPreview data={displayArchitecture} />
                  </div>
                ) : (
                  <EmptyState message="Architecture will appear here." />
                )}
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card
                title="Component Tree"
                description="Planned components grouped by section"
              >
                {componentTree ? (
                  <div className="space-y-4">
                    {(
                      Object.keys(SECTION_LABELS) as DashboardSectionId[]
                    ).map((sectionId) => {
                      const plans = componentTree[sectionId];
                      if (plans.length === 0) {
                        return null;
                      }

                      return (
                        <div key={sectionId}>
                          <h3 className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                            {SECTION_LABELS[sectionId]}
                          </h3>
                          <ul className="space-y-2">
                            {plans.map((plan) => (
                              <li
                                key={`${plan.type}-${plan.dataBinding ?? plan.purpose}`}
                                className="rounded-lg border border-zinc-100 px-3 py-2 dark:border-zinc-800"
                              >
                                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                  {plan.type}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                  {plan.purpose}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState message="Component tree builds from architecture." />
                )}
              </Card>

              <Card
                title="Generated Code"
                description="TSX snippets from the component agent"
              >
                {result?.export.content ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                      >
                        Download export
                      </button>
                      <span className="self-center text-xs text-zinc-500">
                        {result.export.componentCount} component(s)
                      </span>
                    </div>
                    <pre className="max-h-96 overflow-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-100 whitespace-pre-wrap">
                      {result.export.content}
                    </pre>
                  </div>
                ) : displayComponents.length > 0 ? (
                  <pre className="max-h-96 overflow-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-100 whitespace-pre-wrap">
                    {displayComponents
                      .map((component) => component.sourceCode)
                      .join("\n\n")}
                  </pre>
                ) : (
                  <EmptyState message="Generated TSX appears after pipeline run." />
                )}
              </Card>
            </div>

            <Card
              title="Memory History"
              description="Saved generations in browser localStorage"
            >
              {history.length > 0 ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {history.map((entry) => (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() => handleLoadGeneration(entry.id)}
                        className={`w-full rounded-lg border px-4 py-3 text-left transition hover:border-sky-300 hover:bg-sky-50 dark:hover:border-sky-700 dark:hover:bg-sky-950/30 ${
                          loadedSnapshot?.id === entry.id
                            ? "border-sky-400 bg-sky-50 dark:border-sky-600 dark:bg-sky-950/40"
                            : "border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {entry.dashboardType}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                          {entry.widgets.length > 0
                            ? entry.widgets.join(" · ")
                            : "No widgets"}
                        </p>
                        {entry.snapshot ? (
                          <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            Full snapshot
                          </p>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState message="Generate a dashboard to save history." />
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
