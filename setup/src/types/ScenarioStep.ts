export type ScenarioStep = "initialize" | "initial-deal" | UserScenarioStep;

export type UserScenarioStep =
  | "request-stand"
  | "request-hit"
  | "house-stand"
  | "house-hit";

export const isUserScenarioStep = (step: string): step is UserScenarioStep => {
  return ["request-stand", "request-hit", "house-stand", "house-hit"].includes(
    step
  );
};
