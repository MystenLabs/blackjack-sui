import { Loader2 } from "lucide-react";
import React from "react";

interface SpinnerProps {
  className?: string;
}

export const Spinner = ({ className = "text-primary" }: SpinnerProps) => {
  return (
    <div className="flex justify-center items-center">
      <Loader2 className={`w-7 h-7 ${className} animate-spin`} />
    </div>
  );
};
