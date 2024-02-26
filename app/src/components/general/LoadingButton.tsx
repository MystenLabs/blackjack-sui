import React from "react";
import { Button, ButtonProps } from "../ui/button";
import { Spinner } from "./Spinner";

interface LoadingButtonProps extends ButtonProps {
  isLoading: boolean;
  showSpinner?: boolean;
  spinnerClassName?: string;
}

export const LoadingButton = ({
  isLoading,
  showSpinner = true,
  children,
  spinnerClassName,
  ...props
}: LoadingButtonProps) => {
  return (
    <Button
      className="flex space-x-2 items-center"
      disabled={isLoading}
      {...props}
    >
      {!!isLoading && !!showSpinner && <Spinner className={spinnerClassName} />}
      {children}
    </Button>
  );
};
