import { Scenario } from "./helpers/scenario/Scenario";
import { UserScenarioStep, isUserScenarioStep } from "./types/ScenarioStep";
import { BJ_PLAYER_SECRET_KEY } from "./config";

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

  if (!BJ_PLAYER_SECRET_KEY) {
    throw new Error("BJ_PLAYER_SECRET_KEY is not set");
  }
  const scenario = new Scenario({
    steps: steps as UserScenarioStep[],
    playerSecretKey: BJ_PLAYER_SECRET_KEY,
  });

  scenario.run();
};

customScenario();
