"use client";

import { useWalletKit } from "@mysten/wallet-kit";
import { ConnectWalletPaper } from "@/components/connectWallet/ConnectWalletPaper";
import { ChildrenProps } from "@/types/ChildrenProps";
import { useAuthentication } from "@/contexts/Authentication";
import { Spinner } from "@/components/general/Spinner";

export default function AdminRootLayout({ children }: ChildrenProps) {
  const { user, isLoading } = useAuthentication();
  const { currentAccount } = useWalletKit();

  if (isLoading) {
    return <Spinner />;
  }
  
  if (user?.role !== "admin") {
    return "Not allowed";
  }

  if (!currentAccount) {
    return <ConnectWalletPaper />;
  }

  return children;
}
