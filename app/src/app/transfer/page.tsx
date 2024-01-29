import { Paper } from "@/components/general/Paper";
import { TransferSUIForm } from "@/components/forms/TransferSUIForm";
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transfer SUI",
};

const TransferSUIPage = () => {
  return (
    <Paper>
      <TransferSUIForm />
    </Paper>
  );
};

export default TransferSUIPage;
