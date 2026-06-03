export type MemoryRecordType =
  | "requirement"
  | "architecture"
  | "component"
  | "session";

export interface MemoryRecord {
  id: string;
  key: string;
  value: unknown;
  type: MemoryRecordType;
  createdAt: string;
  updatedAt: string;
}
