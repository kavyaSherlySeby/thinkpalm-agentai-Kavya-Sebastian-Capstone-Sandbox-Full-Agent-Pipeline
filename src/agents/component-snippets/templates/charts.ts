import type { ComponentSnippetTemplate } from "../types";
import { buildSelfClosingTag } from "../tsx-tag";

export const chartTemplates: readonly ComponentSnippetTemplate[] = [
  {
    planType: "LineChart",
    dataBinding: "temperature",
    componentName: "TemperatureChart",
    buildSnippet: () => buildSelfClosingTag("TemperatureChart"),
  },
  {
    planType: "GaugeChart",
    dataBinding: "fuel",
    componentName: "FuelGauge",
    buildSnippet: () => buildSelfClosingTag("FuelGauge"),
  },
  {
    planType: "MapView",
    dataBinding: "gps",
    componentName: "LocationMap",
    buildSnippet: () => buildSelfClosingTag("LocationMap"),
  },
  {
    planType: "SensorGrid",
    dataBinding: "sensors",
    componentName: "SensorGrid",
    buildSnippet: () => buildSelfClosingTag("SensorGrid"),
  },
];
