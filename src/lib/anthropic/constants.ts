export const ANTHROPIC_API_KEY_ENV = "ANTHROPIC_API_KEY";

export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

export const ALLOWED_DATA_SOURCES = [
  "temperature",
  "fuel",
  "gps",
  "alerts",
  "sensors",
] as const;

export const ALLOWED_WIDGETS = [
  "temperature-chart",
  "fuel-gauge",
  "location-map",
  "alerts-panel",
  "sensor-grid",
] as const;
