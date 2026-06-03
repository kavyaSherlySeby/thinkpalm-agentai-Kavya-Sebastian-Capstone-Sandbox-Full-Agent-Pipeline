export interface LayoutSection {
  id: string;
  title: string;
  gridArea?: string;
}

export type DashboardSectionId =
  | "header"
  | "kpiCards"
  | "charts"
  | "alerts";

export interface ComponentPlan {
  type: string;
  purpose: string;
  sectionId: DashboardSectionId;
  dataBinding?: string;
}

export interface DashboardArchitecture {
  id: string;
  name: string;
  layout: LayoutSection[];
  componentPlan: ComponentPlan[];
  metadata: Record<string, unknown>;
}
