import React from "react";
import { Paper } from "../general/Paper";
import { ConnectWallet } from "./ConnectWallet";

interface ConnectWalletPaperProps {
  className?: string;
}

export const ConnectWalletPaper = ({
  className = "",
}: ConnectWalletPaperProps) => {
  return (
    <Paper className={className}>
      <ConnectWallet />
    </Paper>
  );
};
