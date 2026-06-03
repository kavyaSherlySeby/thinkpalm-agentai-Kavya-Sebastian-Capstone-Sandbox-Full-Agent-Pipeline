import type { PipelineRunResult } from "@/types";

/**
 * Short-term, in-process memory for the current browser session.
 * Holds the active PRD draft and the latest pipeline run (not persisted to disk).
 */
export class SessionMemory {
  private prdDraft = "";
  private currentRun: PipelineRunResult | null = null;

  setPrdDraft(text: string): void {
    this.prdDraft = text;
  }

  getPrdDraft(): string {
    return this.prdDraft;
  }

  setCurrentRun(result: PipelineRunResult): void {
    this.currentRun = result;
  }

  getCurrentRun(): PipelineRunResult | null {
    return this.currentRun;
  }

  clearCurrentRun(): void {
    this.currentRun = null;
  }

  clear(): void {
    this.prdDraft = "";
    this.currentRun = null;
  }
}
