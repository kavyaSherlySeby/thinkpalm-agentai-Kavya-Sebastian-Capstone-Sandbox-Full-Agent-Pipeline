import { MemoryService } from "@/memory/memory-service";

const memory = new MemoryService();

memory.saveGeneration({
  dashboardType: "Marine Dashboard",
  widgets: ["temperature-chart", "fuel-gauge"],
  timestamp: new Date().toISOString(),
    architecture: {
    id: "1",
    name: "Marine Dashboard",
    layout: [],
    componentPlan: [],
    metadata: {
      requirementAnalysisId: "1",
      objectives: [],
      constraints: [],
      sections: [],
      generatedAt: new Date().toISOString()
    }
  }
});

console.log(memory.getHistory());