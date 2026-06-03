import type { ComponentPlan } from "@/types";

export interface ComponentSnippetTemplate {
  readonly planType: string;
  readonly dataBinding?: string;
  readonly componentName: string;
  buildSnippet(plan: ComponentPlan): string;
}
