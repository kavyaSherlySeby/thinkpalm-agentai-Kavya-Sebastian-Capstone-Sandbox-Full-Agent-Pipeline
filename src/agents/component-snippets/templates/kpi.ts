import type { ComponentSnippetTemplate } from "../types";
import { buildSelfClosingTag } from "../tsx-tag";

export const kpiTemplates: readonly ComponentSnippetTemplate[] = [
  {
    planType: "KpiCard",
    dataBinding: "temperature",
    componentName: "TemperatureKpi",
    buildSnippet: () => buildSelfClosingTag("TemperatureKpi"),
  },
  {
    planType: "KpiCard",
    dataBinding: "fuel",
    componentName: "FuelKpi",
    buildSnippet: () => buildSelfClosingTag("FuelKpi"),
  },
  {
    planType: "KpiCard",
    dataBinding: "gps",
    componentName: "FleetLocationKpi",
    buildSnippet: () => buildSelfClosingTag("FleetLocationKpi"),
  },
  {
    planType: "KpiCard",
    dataBinding: "sensors",
    componentName: "SensorStatusKpi",
    buildSnippet: () => buildSelfClosingTag("SensorStatusKpi"),
  },
];
