import type { ComponentPlan } from "@/types";

import type { ComponentSnippetTemplate } from "./types";
import { ALL_SNIPPET_TEMPLATES } from "./templates";
import { buildSelfClosingTag } from "./tsx-tag";

export function resolveSnippetTemplate(
  plan: ComponentPlan,
): ComponentSnippetTemplate {
  const exactMatch = ALL_SNIPPET_TEMPLATES.find(
    (template) =>
      template.planType === plan.type &&
      template.dataBinding === plan.dataBinding,
  );
  if (exactMatch) {
    return exactMatch;
  }

  const typeMatch = ALL_SNIPPET_TEMPLATES.find(
    (template) =>
      template.planType === plan.type && template.dataBinding === undefined,
  );
  if (typeMatch) {
    return typeMatch;
  }

  return createFallbackTemplate(plan);
}

function createFallbackTemplate(plan: ComponentPlan): ComponentSnippetTemplate {
  const componentName = plan.type.replace(/\s+/g, "");

  return {
    planType: plan.type,
    dataBinding: plan.dataBinding,
    componentName,
    buildSnippet: () =>
      buildSelfClosingTag(componentName, {
        ...(plan.dataBinding ? { dataBinding: plan.dataBinding } : {}),
        sectionId: plan.sectionId,
      }),
  };
}
