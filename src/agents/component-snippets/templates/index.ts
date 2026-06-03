import type { ComponentSnippetTemplate } from "../types";
import { alertTemplates } from "./alerts";
import { chartTemplates } from "./charts";
import { headerTemplates } from "./header";
import { kpiTemplates } from "./kpi";

export const ALL_SNIPPET_TEMPLATES: readonly ComponentSnippetTemplate[] = [
  ...headerTemplates,
  ...kpiTemplates,
  ...chartTemplates,
  ...alertTemplates,
];
