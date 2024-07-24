import { getNetworkName } from "@/helpers/getNetworkName";
import { getSuiExplorerLink } from "@/helpers/getSuiExplorerLink";
import { formatAddress } from "@mysten/sui/utils";
import { OpenInNewWindowIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import React from "react";

interface SuiExplorerLinkProps {
  objectId: string;
  type: "object" | "address" | "module";
  moduleName?: string;
  className?: string;
}

export const SuiExplorerLink = ({
  objectId,
  type,
  moduleName,
  className = "",
}: SuiExplorerLinkProps) => {
  return (
    <Link
      href={getSuiExplorerLink({ objectId, moduleName, type })}
      rel="noopenner noreferrer"
      target="_blank"
      className={`flex space-x-2 items-center text-gray-500 ${className}`}
    >
      <div>{formatAddress(objectId)}</div>
      <OpenInNewWindowIcon />
    </Link>
  );
};
