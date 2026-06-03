export type ValidationCheckId = "layout" | "sections" | "widgets";

export interface ValidationIssue {
  check: ValidationCheckId;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  checkedAt: string;
}
