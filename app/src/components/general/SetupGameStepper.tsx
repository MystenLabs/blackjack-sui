import React from "react";
import { Stepper } from "react-form-stepper";

interface SetupGameStepperProps {
  step: number;
}

export const SetupGameStepper = ({ step }: SetupGameStepperProps) => {
  console.log("step", step);
    return (
    <Stepper
      steps={[
        { label: "Top Up" },
        { label: "Get Counter NFT" },
        { label: "Prepare Game" },
      ]}
      activeStep={step}
    />
  );
};
