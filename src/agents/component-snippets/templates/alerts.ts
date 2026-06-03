import type { ComponentSnippetTemplate } from "../types";
import { buildSelfClosingTag } from "../tsx-tag";

export const alertTemplates: readonly ComponentSnippetTemplate[] = [
  {
    planType: "AlertsPanel",
    dataBinding: "alerts",
    componentName: "AlertPanel",
    buildSnippet: () => buildSelfClosingTag("AlertPanel"),
  },
];
