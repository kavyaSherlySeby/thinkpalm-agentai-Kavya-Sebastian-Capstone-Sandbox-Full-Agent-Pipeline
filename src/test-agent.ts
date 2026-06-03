import { RequirementAnalysisAgent } from '@/agents/requirement-analysis-agent';

async function test() {
  const agent = new RequirementAnalysisAgent();

  const result = await agent.analyze(`
    Build a marine monitoring dashboard.

    Show:
    - Engine temperature
    - Fuel level
    - GPS location
    - Active alarms
  `);

  console.log(JSON.stringify(result, null, 2));
}

test();