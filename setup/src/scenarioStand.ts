import { Scenario } from "./helpers/scenario/Scenario";
import { BJ_PLAYER_SECRET_KEY } from "./config";

const run = async () => {
  if (!BJ_PLAYER_SECRET_KEY) {
    throw new Error("BJ_PLAYER_SECRET_KEY is not set");
  }

  const scenario = new Scenario({
    steps: ["request-stand", "house-stand"],
    playerSecretKey: BJ_PLAYER_SECRET_KEY,
  });

  await scenario.run();
};

run();
