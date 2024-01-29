"use client";

import { ConnectWalletPaper } from "@/components/connectWallet/ConnectWalletPaper";
import { useWalletKit } from "@mysten/wallet-kit";
import { ChildrenProps } from "@/types/ChildrenProps";
import { useAuthentication } from "@/contexts/Authentication";
import { Spinner } from "@/components/general/Spinner";

export default function MemberRootLayout({ children }: ChildrenProps) {
  const { currentAccount } = useWalletKit();
  const { user, isLoading } = useAuthentication();

  if (isLoading) {
    return <Spinner />;
  }

  if (user?.role !== "member") {
    return "Not allowed";
  }

  if (!currentAccount) {
    return <ConnectWalletPaper />;
  }

  return children;
}
