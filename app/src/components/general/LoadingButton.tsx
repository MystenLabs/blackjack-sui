import React from "react";
import { Button, ButtonProps } from "../ui/button";
import { Spinner } from "./Spinner";

interface LoadingButtonProps extends ButtonProps {
  isLoading: boolean;
}

export const LoadingButton = ({
  isLoading,
  children,
  ...props
}: LoadingButtonProps) => {
  return (
    <Button
      className="flex space-x-2 items-center"
      disabled={isLoading}
      {...props}
    >
      {!!isLoading && <Spinner />}
      {children}
    </Button>
  );
};
