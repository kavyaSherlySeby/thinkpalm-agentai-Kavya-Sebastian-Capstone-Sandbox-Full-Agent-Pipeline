import { ClaudeApiError, ClaudeTool } from "@/tools/claude-tool";
import type {
  AgentToolUsage,
  ClaudeToolUsageOutput,
  RequirementAnalysis,
  RequirementAnalysisAgentResult,
} from "@/types";

type DetectedCapability =
  | "temperature"
  | "fuel"
  | "gps"
  | "alerts"
  | "sensors";

interface CapabilityDefinition {
  readonly capability: DetectedCapability;
  readonly keywords: readonly string[];
  readonly dataSource: string;
  readonly widget: string;
  readonly objective: string;
}

const CAPABILITY_DEFINITIONS: readonly CapabilityDefinition[] = [
  {
    capability: "temperature",
    keywords: ["temperature", "temp", "thermal", "celsius", "fahrenheit"],
    dataSource: "temperature",
    widget: "temperature-chart",
    objective: "Monitor temperature readings across assets",
  },
  {
    capability: "fuel",
    keywords: ["fuel", "gasoline", "diesel", "tank level", "fuel level"],
    dataSource: "fuel",
    widget: "fuel-gauge",
    objective: "Track fuel levels and consumption",
  },
  {
    capability: "gps",
    keywords: [
      "gps",
      "location",
      "geolocation",
      "latitude",
      "longitude",
      "tracking",
      "position",
    ],
    dataSource: "gps",
    widget: "location-map",
    objective: "Visualize asset location and movement",
  },
  {
    capability: "alerts",
    keywords: ["alert", "alerts", "alarm", "notification", "warning"],
    dataSource: "alerts",
    widget: "alerts-panel",
    objective: "Surface critical alerts and notifications",
  },
  {
    capability: "sensors",
    keywords: ["sensor", "sensors", "telemetry", "iot device", "device data"],
    dataSource: "sensors",
    widget: "sensor-grid",
    objective: "Aggregate and display sensor telemetry",
  },
];

const CONSTRAINT_KEYWORDS: readonly {
  readonly keyword: string;
  readonly constraint: string;
}[] = [
  { keyword: "real-time", constraint: "Requires real-time data updates" },
  { keyword: "real time", constraint: "Requires real-time data updates" },
  { keyword: "historical", constraint: "Must support historical data views" },
  { keyword: "mobile", constraint: "Must be usable on mobile devices" },
  { keyword: "offline", constraint: "Must tolerate offline or degraded connectivity" },
  { keyword: "sla", constraint: "Subject to SLA or uptime requirements" },
  { keyword: "secure", constraint: "Security and access control required" },
  { keyword: "compliance", constraint: "Regulatory or compliance constraints apply" },
];

const FALLBACK_OBJECTIVE =
  "Define IoT dashboard requirements from the provided PRD";

export class RequirementAnalysisAgent {
  private readonly claudeTool: ClaudeTool;

  constructor(claudeTool: ClaudeTool = new ClaudeTool()) {
    this.claudeTool = claudeTool;
  }

  async analyze(rawPrdText: string): Promise<RequirementAnalysisAgentResult> {
    const keywordAnalysis = this.analyzeWithKeywords(rawPrdText);
    const toolUsage: AgentToolUsage[] = [];

    try {
      const claudeResult = await this.claudeTool.analyzePRD(rawPrdText);
      const analysis = this.mergeAnalyses(claudeResult.analysis, keywordAnalysis);

      toolUsage.push({
        tool: "ClaudeTool",
        action: "analyzePRD",
        summary: `PRD analyzed via Anthropic (${claudeResult.model ?? "unknown model"})`,
        output: {
          source: claudeResult.source,
          model: claudeResult.model,
          analysisId: analysis.id,
        } satisfies ClaudeToolUsageOutput,
      });

      return { analysis, toolUsage };
    } catch (error) {
      const errorMessage =
        error instanceof ClaudeApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Claude analysis failed";

      toolUsage.push({
        tool: "ClaudeTool",
        action: "analyzePRD",
        summary: `Local Fallback Mode active — keyword extraction (Claude API Mode unavailable)`,
        output: {
          source: "fallback",
          analysisId: keywordAnalysis.id,
          error: errorMessage,
        } satisfies ClaudeToolUsageOutput,
      });

      return { analysis: keywordAnalysis, toolUsage };
    }
  }

  private mergeAnalyses(
    claudeAnalysis: RequirementAnalysis,
    keywordAnalysis: RequirementAnalysis,
  ): RequirementAnalysis {
    const hasKeywordObjectives =
      keywordAnalysis.objectives.length > 0 &&
      keywordAnalysis.objectives[0] !== FALLBACK_OBJECTIVE;

    return {
      id: crypto.randomUUID(),
      rawRequirements: keywordAnalysis.rawRequirements,
      createdAt: new Date().toISOString(),
      objectives: hasKeywordObjectives
        ? keywordAnalysis.objectives
        : claudeAnalysis.objectives,
      dataSources:
        keywordAnalysis.dataSources.length > 0
          ? keywordAnalysis.dataSources
          : claudeAnalysis.dataSources,
      widgets:
        keywordAnalysis.widgets.length > 0
          ? keywordAnalysis.widgets
          : claudeAnalysis.widgets,
      constraints: [
        ...new Set([
          ...claudeAnalysis.constraints,
          ...keywordAnalysis.constraints,
        ]),
      ],
    };
  }

  private analyzeWithKeywords(rawPrdText: string): RequirementAnalysis {
    const normalizedText = rawPrdText.toLowerCase();
    const detectedCapabilities = this.detectCapabilities(normalizedText);

    return {
      id: crypto.randomUUID(),
      rawRequirements: rawPrdText,
      objectives: this.buildObjectives(detectedCapabilities),
      dataSources: this.buildDataSources(detectedCapabilities),
      widgets: this.buildWidgets(detectedCapabilities),
      constraints: this.extractConstraints(normalizedText),
      createdAt: new Date().toISOString(),
    };
  }

  private detectCapabilities(
    normalizedText: string,
  ): readonly CapabilityDefinition[] {
    return CAPABILITY_DEFINITIONS.filter((definition) =>
      definition.keywords.some((keyword) =>
        normalizedText.includes(keyword.toLowerCase()),
      ),
    );
  }

  private buildObjectives(
    detectedCapabilities: readonly CapabilityDefinition[],
  ): string[] {
    if (detectedCapabilities.length === 0) {
      return [FALLBACK_OBJECTIVE];
    }
    return detectedCapabilities.map((definition) => definition.objective);
  }

  private buildDataSources(
    detectedCapabilities: readonly CapabilityDefinition[],
  ): string[] {
    return detectedCapabilities.map((definition) => definition.dataSource);
  }

  private buildWidgets(
    detectedCapabilities: readonly CapabilityDefinition[],
  ): string[] {
    return detectedCapabilities.map((definition) => definition.widget);
  }

  private extractConstraints(normalizedText: string): string[] {
    const matched = CONSTRAINT_KEYWORDS.filter(({ keyword }) =>
      normalizedText.includes(keyword),
    ).map(({ constraint }) => constraint);

    return [...new Set(matched)];
  }
}
