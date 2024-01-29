import { Loader2 } from "lucide-react";
import React from "react";

export const Spinner = () => {
  return (
    <div className="flex justify-center items-center">
      <Loader2 className="w-7 h-7 text-primary animate-spin" />
    </div>
  );
};
