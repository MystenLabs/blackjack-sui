import { Paper } from "@/components/general/Paper";
import React from "react";

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center space-y-5 py-12">
      <div className="text-xl font-bold text-primary">404</div>
      <div className="text-lg">Page Not Found</div>
    </div>
  );
};

export default NotFoundPage;
