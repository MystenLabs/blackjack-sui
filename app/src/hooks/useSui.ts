import { SuiClient } from "@mysten/sui/client";

export const useSui = () => {
  const FULL_NODE = process.env.NEXT_PUBLIC_SUI_NETWORK!;
  const suiClient = new SuiClient({ url: FULL_NODE });

  return { suiClient };
};
