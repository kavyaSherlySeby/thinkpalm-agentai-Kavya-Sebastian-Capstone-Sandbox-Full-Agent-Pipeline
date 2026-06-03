import type { PipelineGenerationSnapshot, SaveGenerationInput, StoredGeneration } from "@/types";

const STORAGE_KEY = "iot-dashboard-architect:generations";

export class MemoryService {
  saveGeneration(input: SaveGenerationInput): StoredGeneration {
    const record: StoredGeneration = {
      id: input.id ?? crypto.randomUUID(),
      timestamp: input.timestamp ?? new Date().toISOString(),
      dashboardType: input.dashboardType,
      widgets: [...input.widgets],
      architecture: input.architecture,
      ...(input.snapshot ? { snapshot: cloneSnapshot(input.snapshot) } : {}),
    };

    const history = this.readAll();
    const existingIndex = history.findIndex((entry) => entry.id === record.id);

    if (existingIndex >= 0) {
      history[existingIndex] = record;
    } else {
      history.push(record);
    }

    this.writeAll(history);
    return record;
  }

  getHistory(): StoredGeneration[] {
    return this.readAll().sort(
      (left, right) =>
        Date.parse(right.timestamp) - Date.parse(left.timestamp),
    );
  }

  loadGeneration(id: string): StoredGeneration | null {
    return this.readAll().find((entry) => entry.id === id) ?? null;
  }

  private readAll(): StoredGeneration[] {
    const storage = this.getStorage();
    if (!storage) {
      return [];
    }

    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter(isStoredGeneration);
    } catch {
      return [];
    }
  }

  private writeAll(records: StoredGeneration[]): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  private getStorage(): Storage | null {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage;
  }
}

function cloneSnapshot(
  snapshot: PipelineGenerationSnapshot,
): PipelineGenerationSnapshot {
  return structuredClone(snapshot);
}

function isStoredGeneration(value: unknown): value is StoredGeneration {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  const hasValidCore =
    typeof record.id === "string" &&
    typeof record.timestamp === "string" &&
    typeof record.dashboardType === "string" &&
    Array.isArray(record.widgets) &&
    record.widgets.every((widget) => typeof widget === "string") &&
    isDashboardArchitecture(record.architecture);

  if (!hasValidCore) {
    return false;
  }

  if (record.snapshot === undefined) {
    return true;
  }

  return isPipelineGenerationSnapshot(record.snapshot);
}

function isDashboardArchitecture(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  const architecture = value as Record<string, unknown>;

  return (
    typeof architecture.id === "string" &&
    typeof architecture.name === "string" &&
    Array.isArray(architecture.layout) &&
    Array.isArray(architecture.componentPlan) &&
    typeof architecture.metadata === "object" &&
    architecture.metadata !== null
  );
}

function isPipelineGenerationSnapshot(
  value: unknown,
): value is PipelineGenerationSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snapshot = value as Record<string, unknown>;

  return (
    snapshot.analysis !== undefined &&
    typeof snapshot.analysis === "object" &&
    Array.isArray(snapshot.components) &&
    typeof snapshot.export === "object" &&
    snapshot.export !== null &&
    Array.isArray(snapshot.toolUsage) &&
    typeof snapshot.execution === "object" &&
    snapshot.execution !== null &&
    typeof snapshot.validation === "object" &&
    snapshot.validation !== null
  );
}
