import { getNetworkName } from "./getNetworkName";

interface GetSuiExplorerLinkProps {
  type: "module" | "object" | "address";
  objectId: string;
  moduleName?: string;
}

export const getSuiExplorerLink = ({
  type,
  objectId,
  moduleName,
}: GetSuiExplorerLinkProps) => {
  const URLParams = `${
    type === "module" ? `module=${moduleName}&` : ""
  }network=${getNetworkName()}`;
  const URLType = type === "module" ? "object" : type;
  const href = `https://suiexplorer.com/${URLType}/${objectId}?${URLParams}`;
  return href;
};
