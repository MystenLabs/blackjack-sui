import { Scenario } from "./helpers/scenario/Scenario";
import { UserScenarioStep, isUserScenarioStep } from "./types/ScenarioStep";

const customScenario = () => {
  const args = process.argv;
  if (args.length <= 3) {
    throw new Error("USAGE: npm run scenario -- <step> <step> ...");
  }
  const steps = args.slice(3);
  console.log(steps);

  const invalidSteps = steps.filter(
    (step: string) => !isUserScenarioStep(step)
  );
  if (invalidSteps.length > 0) {
    throw new Error(`Invalid steps: ${invalidSteps.join(", ")}`);
  }

  const scenario = new Scenario({
    steps: steps as UserScenarioStep[],
    playerSecretKey: "AOhmUbeF+mDZeW5Vk+jU0dGDcAYuxQES0ftRH505yAQv",
  });

  scenario.run();
};

customScenario();
