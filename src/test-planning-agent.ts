import { DashboardPlanningAgent } from "@/agents/dashboard-planning-agent";
import type { RequirementAnalysis } from "@/types";

const mockAnalysis: RequirementAnalysis = {
  id: crypto.randomUUID(),
  rawRequirements: "Build a marine monitoring dashboard. Show: - Engine temperature - Fuel level - GPS location - Active alarms",
  objectives: [
    "Monitor vessel health"
  ],

  constraints: [],

  widgets: [
    "temperature-chart",
    "fuel-gauge"
  ],

  dataSources: [
    "temperature",
    "fuel"
  ],

  createdAt: new Date().toISOString()
};

const agent = new DashboardPlanningAgent();

const result = agent.plan(mockAnalysis);

console.log(JSON.stringify(result.architecture, null, 2));
console.log("toolUsage:", JSON.stringify(result.toolUsage, null, 2));