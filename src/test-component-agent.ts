import { ComponentGenerationAgent } from "@/agents/component-generation-agent";
import type { DashboardArchitecture } from "@/types";

const architecture: DashboardArchitecture = {
  id: "arch-001",

  name: "Marine Dashboard",

  layout: [],

  metadata: {
    requirementAnalysisId: "req-001",
    objectives: [],
    constraints: [],
    sections: ["header", "kpiCards", "charts", "alerts"],
    generatedAt: new Date().toISOString(),
  },

  componentPlan: [
    {
      type: "DashboardHeader",
      purpose: "Dashboard title",
      sectionId: "header",
    },

    {
      type: "KpiCard",
      purpose: "Fuel level",
      sectionId: "kpiCards",
      dataBinding: "fuel",
    },

    {
      type: "LineChart",
      purpose: "Temperature trend",
      sectionId: "charts",
      dataBinding: "temperature",
    },
    {
      type: "AlertsPanel",
      purpose: "Show alerts",
      sectionId: "alerts",
      dataBinding: "alerts",
    },
  ],
};

const agent = new ComponentGenerationAgent();

const result = agent.generate(architecture);

console.log(JSON.stringify(result.components, null, 2));
console.log("toolUsage:", JSON.stringify(result.toolUsage, null, 2));