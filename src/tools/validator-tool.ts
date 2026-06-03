import type {
  DashboardArchitecture,
  DashboardSectionId,
  ValidationIssue,
  ValidationResult,
} from "@/types";

const REQUIRED_SECTION_IDS: readonly DashboardSectionId[] = [
  "header",
  "kpiCards",
  "charts",
  "alerts",
];

export class ValidatorTool {
  validate(architecture: DashboardArchitecture): ValidationResult {
    const issues: ValidationIssue[] = [
      ...this.validateLayout(architecture),
      ...this.validateSections(architecture),
      ...this.validateWidgets(architecture),
    ];

    return {
      valid: issues.length === 0,
      issues,
      checkedAt: new Date().toISOString(),
    };
  }

  private validateLayout(architecture: DashboardArchitecture): ValidationIssue[] {
    if (!architecture.layout || architecture.layout.length === 0) {
      return [
        {
          check: "layout",
          message: "Dashboard layout is missing or empty",
        },
      ];
    }

    const invalidSections = architecture.layout.filter(
      (section) => !section.id?.trim() || !section.title?.trim(),
    );

    if (invalidSections.length > 0) {
      return [
        {
          check: "layout",
          message: "Layout contains sections without a valid id or title",
        },
      ];
    }

    return [];
  }

  private validateSections(
    architecture: DashboardArchitecture,
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const layoutSectionIds = new Set(
      architecture.layout.map((section) => section.id),
    );

    const missingSections = REQUIRED_SECTION_IDS.filter(
      (sectionId) => !layoutSectionIds.has(sectionId),
    );

    if (missingSections.length > 0) {
      issues.push({
        check: "sections",
        message: `Missing required sections: ${missingSections.join(", ")}`,
      });
    }

    for (const sectionId of REQUIRED_SECTION_IDS) {
      if (!layoutSectionIds.has(sectionId)) {
        continue;
      }

      const componentsInSection = architecture.componentPlan.filter(
        (plan) => plan.sectionId === sectionId,
      );

      if (componentsInSection.length === 0) {
        issues.push({
          check: "sections",
          message: `Section "${sectionId}" has no assigned widgets`,
        });
      }
    }

    const orphanComponents = architecture.componentPlan.filter(
      (plan) => !layoutSectionIds.has(plan.sectionId),
    );

    if (orphanComponents.length > 0) {
      issues.push({
        check: "sections",
        message: "Some widgets reference sections that are not in the layout",
      });
    }

    return issues;
  }

  private validateWidgets(architecture: DashboardArchitecture): ValidationIssue[] {
    if (!architecture.componentPlan || architecture.componentPlan.length === 0) {
      return [
        {
          check: "widgets",
          message: "No widgets defined in component plan",
        },
      ];
    }

    const invalidWidgets = architecture.componentPlan.filter(
      (plan) => !plan.type?.trim() || !plan.purpose?.trim(),
    );

    if (invalidWidgets.length > 0) {
      return [
        {
          check: "widgets",
          message: "One or more widgets are missing a type or purpose",
        },
      ];
    }

    return [];
  }
}
