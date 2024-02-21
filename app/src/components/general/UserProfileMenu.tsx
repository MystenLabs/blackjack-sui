import React, { useMemo } from "react";
import {
  useEnokiFlow,
  useZkLogin,
  useZkLoginSession,
} from "@mysten/enoki/react";
import { Button } from "@/components/ui/button";
import { CopyIcon, DotsVerticalIcon } from "@radix-ui/react-icons";
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
import { formatAddress } from "@mysten/sui.js/utils";
import { LogOut } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import Image from "next/image";

export const UserProfileMenu = () => {
  const { address } = useZkLogin();
  const enokiFlow = useEnokiFlow();
  const zkLoginSession = useZkLoginSession();

  const decodedJWT = useMemo(() => {
    if (!zkLoginSession?.jwt) return null;
    const decoded: any = jwtDecode(zkLoginSession?.jwt!);
    return decoded;
  }, [zkLoginSession?.jwt]);

  console.log({ decodedJWT });

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address!);
    toast.success("Address copied to clipboard");
  };

  if (!address) return null;
  return (
    <DropdownMenu>
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
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>
          <div>
            {decodedJWT?.given_name} {decodedJWT?.family_name}
          </div>
          <div className="text-black text-opacity-60 text-xs">
            {decodedJWT?.email}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="flex items-center justify-between w-full">
            <div>{formatAddress(address)}</div>
            <button onClick={handleCopyAddress}>
              <CopyIcon className="w-4 h-4 text-black" />
            </button>
          </DropdownMenuItem>
          {/* <DropdownMenuItem className="flex items-center justify-between w-full">
            <div>{formatAmount(BigNumber(balance))} SUI</div>
            <LoadingButton onClick={handleRequestSui} isLoading={isLoading}>
              Request SUI
            </LoadingButton>
          </DropdownMenuItem> */}
        </DropdownMenuGroup>
        <DropdownMenuItem
          onClick={enokiFlow.logout}
          className="flex items-center justify-between w-full"
        >
          <div>Log out</div>
          <LogOut className="h-4 w-4" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
