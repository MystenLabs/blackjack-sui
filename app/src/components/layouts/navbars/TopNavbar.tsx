import React from "react";
import { NavbarHeader } from "./NavbarHeader";
import { NavbarLinks } from "./NavbarLinks";
import { UserProfileMenu } from "@/components/general/UserProfileMenu";
import { UserAvatar } from "@/components/general/UserAvatar";
import { useAuthentication } from "@/contexts/Authentication";
import { USER_ROLES } from "@/constants/USER_ROLES";
import { ConnectButton, useWalletKit } from "@mysten/wallet-kit";
import { Button } from "@/components/ui/button";
import { CopyIcon } from "@radix-ui/react-icons";
import toast from "react-hot-toast";

export const TopNavbar = () => {
  const { user } = useAuthentication();
  const { currentAccount } = useWalletKit();
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(currentAccount?.address!);
    toast.success("Address copied to clipboard");
  };

  return (
    <div className="sticky top-0 flex w-full h-full bg-primary p-5 space-x-4 justify-between items-center">
      <NavbarHeader showCloseButton={false} onClose={() => {}} />
      <NavbarLinks position="top" />
      <div className="flex justify-end items-center space-x-1">
        <div className="flex space-x-2 justify-end items-center min-w-[250px]">
          {!!currentAccount?.address && (
            <Button onClick={handleCopyAddress} variant="link">
              <CopyIcon className="w-5 h-5 text-white" />
            </Button>
          )}
          <ConnectButton className="!bg-white !text-primary" />
        </div>
        {user?.role !== USER_ROLES.ROLE_4 &&
          process.env.NEXT_PUBLIC_USE_TOP_NAVBAR_IN_LARGE_SCREEN === "1" && (
            <UserProfileMenu
              trigger={<UserAvatar user={user} showNameEmail={false} />}
            />
          )}
      </div>
    </div>
  );
};
