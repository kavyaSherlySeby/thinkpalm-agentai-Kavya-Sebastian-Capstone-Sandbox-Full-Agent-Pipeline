import { ExportTool } from "@/tools/export-tool";
import type {
  AgentToolUsage,
  ComponentGenerationAgentResult,
  ComponentPlan,
  DashboardArchitecture,
  ExportToolUsageOutput,
  GeneratedComponent,
} from "@/types";

import { resolveSnippetTemplate } from "./component-snippets/registry";

export class ComponentGenerationAgent {
  private readonly exportTool: ExportTool;

  constructor(exportTool: ExportTool = new ExportTool()) {
    this.exportTool = exportTool;
  }

  generate(architecture: DashboardArchitecture): ComponentGenerationAgentResult {
    const components = architecture.componentPlan.map((plan) =>
      this.generateComponent(plan, architecture.id),
    );

    const exportOutput = this.exportTool.buildExport(components);

    const toolUsage: AgentToolUsage[] = [
      {
        tool: "ExportTool",
        action: "buildExport",
        summary: `Prepared export for ${exportOutput.componentCount} component(s) as ${exportOutput.filename}`,
        output: {
          filename: exportOutput.filename,
          componentCount: exportOutput.componentCount,
          contentLength: exportOutput.content.length,
        } satisfies ExportToolUsageOutput,
      },
    ];

    return { components, export: exportOutput, toolUsage };
  }

  private generateComponent(
    plan: ComponentPlan,
    architectureId: string,
  ): GeneratedComponent {
    const template = resolveSnippetTemplate(plan);
    const sourceCode = template.buildSnippet(plan);

    return {
      id: crypto.randomUUID(),
      name: template.componentName,
      componentType: template.componentName,
      sourceCode,
      architectureId,
      validated: false,
      createdAt: new Date().toISOString(),
    };
  }
}
