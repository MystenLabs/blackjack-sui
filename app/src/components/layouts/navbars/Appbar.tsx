import { ConnectButton, useWalletKit } from "@mysten/wallet-kit";
import { CopyIcon, HamburgerMenuIcon } from "@radix-ui/react-icons";
import React, { ReactElement, cloneElement } from "react";
import { Button } from "../../ui/button";
import toast from "react-hot-toast";
import { BreadCrumbs } from "../../breadcrumbs/BreadCrumbs";

interface AppBarProps {
  showBurger: boolean;
  onBurgerClick: () => void;
  headerElement: ReactElement;
}

export const AppBar = ({
  showBurger,
  onBurgerClick,
  headerElement,
}: AppBarProps) => {
  const { currentAccount } = useWalletKit();

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(currentAccount?.address!);
    toast.success("Address copied to clipboard");
  };

  return (
    <div className="flex z-10 justify-between items-center border-b-2 w-full sticky top-0 px-4 py-2 bg-gray-200">
      <div className="flex items-center space-x-2">
        {!!showBurger && (
          <Button onClick={onBurgerClick} variant="link" className="pl-0 pr-2">
            <HamburgerMenuIcon className="w-5 h-5" />
          </Button>
        )}
        {cloneElement(headerElement)}
      </div>
      <div className="flex space-x-2 items-center">
        {!!currentAccount?.address && (
          <Button onClick={handleCopyAddress} variant="link">
            <CopyIcon className="w-5 h-5 text-primary" />
          </Button>
        )}
        <ConnectButton className="!bg-primary" />
      </div>
    </div>
  );
};
