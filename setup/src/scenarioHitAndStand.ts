import { Scenario } from "./helpers/scenario/Scenario";

const run = async () => {
  const scenario = new Scenario({
    steps: ["request-hit", "house-hit", "request-stand", "house-stand"],
    playerSecretKey: "AOhmUbeF+mDZeW5Vk+jU0dGDcAYuxQES0ftRH505yAQv",
  });

  await scenario.run();
};

run();
