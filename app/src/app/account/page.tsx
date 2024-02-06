"use client";

import { useGetOwnedObjects } from "../../hooks/useGetOwnedObjects";
import { Paper } from "@/components/general/Paper";
import { ConnectWalletPaper } from "@/components/connectWallet/ConnectWalletPaper";
import { useAuthentication } from "@/contexts/Authentication";
import { UserAvatar } from "@/components/general/UserAvatar";
import { UserProfileMenu } from "@/components/general/UserProfileMenu";

export default function Account() {
  const { currentAccount } = useGetOwnedObjects();
  const { user } = useAuthentication();

  if (!user.id) {
    return <Paper className="text-center">Not logged in</Paper>;
  }
  if (!currentAccount) {
    return <ConnectWalletPaper />;
  }

  return (
    <div className="flex flex-col items-center gap-y-[10px]">
      <div className="bg-primary rounded-xl p-2">
        <div className="flex justify-between items-center">
          <UserAvatar user={user} />
          <UserProfileMenu />
        </div>
      </div>
    </div>
  );
}
