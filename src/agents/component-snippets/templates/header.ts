import type { ComponentSnippetTemplate } from "../types";
import { buildSelfClosingTag } from "../tsx-tag";

export const headerTemplates: readonly ComponentSnippetTemplate[] = [
  {
    planType: "DashboardHeader",
    componentName: "DashboardHeader",
    buildSnippet: (plan) =>
      buildSelfClosingTag("DashboardHeader", {
        title: plan.purpose,
      }),
  },
];
