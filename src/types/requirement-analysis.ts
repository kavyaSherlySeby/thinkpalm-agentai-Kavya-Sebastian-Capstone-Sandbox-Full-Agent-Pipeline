export interface RequirementAnalysis {
  id: string;
  rawRequirements: string;
  objectives: string[];
  dataSources: string[];
  widgets: string[];
  constraints: string[];
  createdAt: string;
}
