import { RequirementAnalysisAgent } from "@/agents/requirement-analysis-agent";
import { DashboardPlanningAgent } from "@/agents/dashboard-planning-agent";
import { ComponentGenerationAgent } from "@/agents/component-generation-agent";
import { PipelineService } from "@/services/pipeline-service";

async function test() {

  const requirementAgent =
    new RequirementAnalysisAgent();

  const planningAgent =
    new DashboardPlanningAgent();

  const componentAgent =
    new ComponentGenerationAgent();

  const pipeline =
    new PipelineService(
      {
        requirement: requirementAgent,
        planning: planningAgent,
        component: componentAgent
      }
    );

  const result = await pipeline.run(`
    Build a marine monitoring dashboard.

    Show:
    - Sensor health dashboard
  `);

  console.log(JSON.stringify(result, null, 2));
}

test();