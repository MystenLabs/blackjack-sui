import React from "react";

interface PaperProps {
  className?: string;
  children: React.ReactNode | React.ReactNode[];
}

export const Paper = ({ className = "", children }: PaperProps) => {
  return (
    <div className={`min-w-[200px] p-2 md:p-5 bg-white shadow-xl rounded-xl ${className}`}>
      {children}
    </div>
  );
};
