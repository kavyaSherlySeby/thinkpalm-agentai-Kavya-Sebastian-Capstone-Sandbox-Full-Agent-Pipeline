import { ValidatorTool } from "@/tools/validator-tool";
import type {
  AgentToolUsage,
  ComponentPlan,
  DashboardArchitecture,
  DashboardSectionId,
  LayoutSection,
  PlanningAgentResult,
  RequirementAnalysis,
  ValidatorToolUsageOutput,
} from "@/types";

interface WidgetPlacement {
  readonly widget: string;
  readonly sectionId: DashboardSectionId;
  readonly type: string;
  readonly purpose: string;
  readonly dataBinding: string;
}

interface DataSourceKpiPlacement {
  readonly dataSource: string;
  readonly type: string;
  readonly purpose: string;
}

const LAYOUT_SECTIONS: readonly LayoutSection[] = [
  { id: "header", title: "Header", gridArea: "header" },
  { id: "kpiCards", title: "KPI Cards", gridArea: "kpi-cards" },
  { id: "charts", title: "Charts", gridArea: "charts" },
  { id: "alerts", title: "Alerts", gridArea: "alerts" },
];

const WIDGET_PLACEMENTS: readonly WidgetPlacement[] = [
  {
    widget: "temperature-chart",
    sectionId: "charts",
    type: "LineChart",
    purpose: "Display temperature trends over time",
    dataBinding: "temperature",
  },
  {
    widget: "fuel-gauge",
    sectionId: "charts",
    type: "GaugeChart",
    purpose: "Visualize current fuel level",
    dataBinding: "fuel",
  },
  {
    widget: "location-map",
    sectionId: "charts",
    type: "MapView",
    purpose: "Show asset locations on a map",
    dataBinding: "gps",
  },
  {
    widget: "sensor-grid",
    sectionId: "charts",
    type: "SensorGrid",
    purpose: "Display telemetry from connected sensors",
    dataBinding: "sensors",
  },
  {
    widget: "alerts-panel",
    sectionId: "alerts",
    type: "AlertsPanel",
    purpose: "List active alerts and notifications",
    dataBinding: "alerts",
  },
];

const DATA_SOURCE_KPI_PLACEMENTS: readonly DataSourceKpiPlacement[] = [
  {
    dataSource: "temperature",
    type: "KpiCard",
    purpose: "Show current average temperature",
  },
  {
    dataSource: "fuel",
    type: "KpiCard",
    purpose: "Show fleet fuel level summary",
  },
  {
    dataSource: "gps",
    type: "KpiCard",
    purpose: "Show count of tracked assets",
  },
  {
    dataSource: "sensors",
    type: "KpiCard",
    purpose: "Show online sensor count",
  },
];

const WIDGET_PLACEMENT_BY_NAME = new Map(
  WIDGET_PLACEMENTS.map((placement) => [placement.widget, placement]),
);

const KPI_PLACEMENT_BY_DATA_SOURCE = new Map(
  DATA_SOURCE_KPI_PLACEMENTS.map((placement) => [
    placement.dataSource,
    placement,
  ]),
);

const SECTION_ORDER: readonly DashboardSectionId[] = [
  "header",
  "kpiCards",
  "charts",
  "alerts",
];

export class DashboardPlanningAgent {
  private readonly validatorTool: ValidatorTool;

  constructor(validatorTool: ValidatorTool = new ValidatorTool()) {
    this.validatorTool = validatorTool;
  }

  plan(requirementAnalysis: RequirementAnalysis): PlanningAgentResult {
    const architecture = this.buildArchitecture(requirementAnalysis);
    const validation = this.validatorTool.validate(architecture);

    const toolUsage: AgentToolUsage[] = [
      {
        tool: "ValidatorTool",
        action: "validate",
        summary: validation.valid
          ? "Architecture passed layout, section, and widget validation"
          : `Architecture validation failed with ${validation.issues.length} issue(s)`,
        output: {
          valid: validation.valid,
          issueCount: validation.issues.length,
        } satisfies ValidatorToolUsageOutput,
      },
    ];

    return { architecture, validation, toolUsage };
  }

  private buildArchitecture(
    requirementAnalysis: RequirementAnalysis,
  ): DashboardArchitecture {
    const componentPlan = this.buildComponentPlan(requirementAnalysis);

    return {
      id: crypto.randomUUID(),
      name: this.buildDashboardName(requirementAnalysis),
      layout: [...LAYOUT_SECTIONS],
      componentPlan,
      metadata: {
        requirementAnalysisId: requirementAnalysis.id,
        objectives: requirementAnalysis.objectives,
        constraints: requirementAnalysis.constraints,
        sections: SECTION_ORDER,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private buildComponentPlan(
    requirementAnalysis: RequirementAnalysis,
  ): ComponentPlan[] {
    const plans: ComponentPlan[] = [
      {
        type: "DashboardHeader",
        purpose:
          requirementAnalysis.objectives[0] ??
          "IoT fleet operations overview",
        sectionId: "header",
      },
    ];

    const sortedDataSources = [...requirementAnalysis.dataSources].sort();
    for (const dataSource of sortedDataSources) {
      if (dataSource === "alerts") {
        continue;
      }

      const kpiPlacement = KPI_PLACEMENT_BY_DATA_SOURCE.get(dataSource);
      if (kpiPlacement) {
        plans.push({
          type: kpiPlacement.type,
          purpose: kpiPlacement.purpose,
          sectionId: "kpiCards",
          dataBinding: dataSource,
        });
      }
    }

    const sortedWidgets = [...requirementAnalysis.widgets].sort();
    for (const widget of sortedWidgets) {
      const placement = WIDGET_PLACEMENT_BY_NAME.get(widget);
      if (placement) {
        plans.push({
          type: placement.type,
          purpose: placement.purpose,
          sectionId: placement.sectionId,
          dataBinding: placement.dataBinding,
        });
      }
    }

    if (
      requirementAnalysis.dataSources.includes("alerts") &&
      !sortedWidgets.includes("alerts-panel")
    ) {
      plans.push({
        type: "AlertsPanel",
        purpose: "List active alerts and notifications",
        sectionId: "alerts",
        dataBinding: "alerts",
      });
    }

    return this.sortComponentPlans(plans);
  }

  private sortComponentPlans(plans: ComponentPlan[]): ComponentPlan[] {
    return [...plans].sort((left, right) => {
      const sectionCompare =
        SECTION_ORDER.indexOf(left.sectionId) -
        SECTION_ORDER.indexOf(right.sectionId);
      if (sectionCompare !== 0) {
        return sectionCompare;
      }

      const typeCompare = left.type.localeCompare(right.type);
      if (typeCompare !== 0) {
        return typeCompare;
      }

      return (left.dataBinding ?? "").localeCompare(right.dataBinding ?? "");
    });
  }

  private buildDashboardName(requirementAnalysis: RequirementAnalysis): string {
    if (requirementAnalysis.dataSources.length === 0) {
      return "IoT Dashboard";
    }

    const labels = [...requirementAnalysis.dataSources].sort().join(", ");
    return `IoT Dashboard — ${labels}`;
  }
}
