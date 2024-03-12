import React from "react";
import { Stepper } from "react-form-stepper";

interface SetupGameStepperProps {
  step: number;
}

const stepStyle = {
  activeBgColor: "#0EA268",
  activeTextColor: "#ffffff",
  completedBgColor: "#4F4F4F",
  completedTextColor: "#ffffff",
  inactiveBgColor: "#4F4F4F",
  inactiveTextColor: "#ffffff",
  size: "2em",
  circleFontSize: "1rem",
  borderRadius: "50%",
  labelFontSize: "1rem",
  fontWeight: "normal",
};

export const SetupGameStepper = ({ step }: SetupGameStepperProps) => {
  return (
    <div className="bg-white flex flex-col w-full rounded-[24px] items-center space-y-1">
      <Stepper
        steps={[
          { label: "Top Up" },
          { label: "Get Counter NFT" },
          { label: "Prepare Game" },
        ]}
        activeStep={step}
        className="w-full"
        styleConfig={stepStyle}
      />
    </div>
  );
};
