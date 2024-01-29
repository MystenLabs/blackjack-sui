"use client";

import { useWalletKit } from "@mysten/wallet-kit";
import { ConnectWalletPaper } from "@/components/connectWallet/ConnectWalletPaper";
import { ChildrenProps } from "@/types/ChildrenProps";
import { useAuthentication } from "@/contexts/Authentication";
import { Spinner } from "@/components/general/Spinner";

export default function ModeratorRootLayout({ children }: ChildrenProps) {
  const { currentAccount } = useWalletKit();
  const { user, isLoading } = useAuthentication();

  if (isLoading) {
    return <Spinner />;
  }

  if (user?.role !== "moderator") {
    return "Not allowed";
  }

  if (!currentAccount) {
    return <ConnectWalletPaper />;
  }

  return children;
}
