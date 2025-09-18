import React, { useMemo } from "react";
import { CopyIcon } from "@radix-ui/react-icons";
import toast from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { formatAddress } from "@mysten/sui/utils";
import { LogOut } from "lucide-react";
import {jwtDecode, JwtPayload} from "jwt-decode";
import Image from "next/image";
import Link from "next/link";
import { getSuiExplorerLink } from "@/helpers/getSuiExplorerLink";
import { formatString } from "@/helpers/formatString";
import useWalletSession from "@/hooks/useWalletSession";
import { useCurrentAccount, useDisconnectWallet  } from "@mysten/dapp-kit";

interface EnokiJwtPayload extends JwtPayload {
  picture?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
}

export const UserProfileMenu = () => {
  const { jwt } = useWalletSession();
  const { mutateAsync: disconnectWallet } = useDisconnectWallet()
  const currentAccount = useCurrentAccount();

  const decodedJWT = useMemo(() => jwt ? jwtDecode<EnokiJwtPayload>(jwt) : null, [jwt]);

  const handleCopyAddress = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    navigator.clipboard.writeText(currentAccount?.address!);
    toast.success("Address copied to clipboard");
  };

  if (!currentAccount) {
    return null;
  }

  return (
    <DropdownMenu>
      {!!decodedJWT?.picture && (
        <DropdownMenuTrigger asChild>
          <button>
            <Image
              src={decodedJWT?.picture}
              alt="profile"
              width={40}
              height={40}
              className="rounded-full pr-0"
            />
          </button>
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>
          <div>
            {decodedJWT?.given_name} {decodedJWT?.family_name}
          </div>
          <div className="text-black text-opacity-60 text-xs">
            {decodedJWT?.email ? formatString(decodedJWT.email, 25) : ""}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="flex items-center justify-between w-full">
            <Link
              className="flex-1"
              href={getSuiExplorerLink({ type: "address", objectId: currentAccount.address })}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>{formatAddress(currentAccount.address)}</div>
            </Link>
            <button onClick={handleCopyAddress}>
              <CopyIcon className="w-4 h-4 text-black" />
            </button>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuItem
          onClick={() => disconnectWallet()}
          className="flex items-center justify-between w-full"
        >
          <div>Log out</div>
          <LogOut className="h-4 w-4" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
