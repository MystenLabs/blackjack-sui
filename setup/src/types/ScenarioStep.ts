export type ScenarioStep = "initialize" | "initial-deal" | UserScenarioStep;

export type UserScenarioStep =
  | "request-stand"
  | "request-hit"
  | "house-stand"
  | "house-hit";
