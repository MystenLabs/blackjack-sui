import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useSui } from "./useSui";
import { useZkLogin, useZkLoginSession } from "@mysten/enoki/react";
import { useBalance } from "@/contexts/BalanceContext";

export const useRequestSui = () => {
  const { suiClient } = useSui();
  const [isLoading, setIsLoading] = useState(false);
  const { handleRefreshBalance } = useBalance();
  const { address } = useZkLogin();
  const zkLoginSession = useZkLoginSession();

  useEffect(() => {
    if (address) handleRefreshBalance();
  }, [address]);

  const handleRequestSui = useCallback(async () => {
    setIsLoading(true);
    console.log({
      enokiApiKey: process.env.NEXT_PUBLIC_ENOKI_API_KEY!,
      jwt: zkLoginSession?.jwt,
    });
    await axios
      .get("https://pocs-faucet.vercel.app/api/faucet", {
        headers: {
          "Enoki-api-key": process.env.NEXT_PUBLIC_ENOKI_API_KEY!,
          Authorization: `Bearer ${zkLoginSession?.jwt}`,
        },
      })
      .then(async (resp) => {
        setIsLoading(false);
        await suiClient.waitForTransaction({
          digest: resp.data.txDigest,
        });
        handleRefreshBalance();
        toast.success("SUI received successfully!");
      })
      .catch((err) => {
        setIsLoading(false);
        console.error(err);
        if (err.response?.status === 429) {
          toast.error("You can only request for SUI once every 10 minutes");
        } else {
          toast.error("Failed to receive SUI");
        }
      });
  }, [zkLoginSession?.jwt]);

  return {
    isLoading,
    handleRequestSui,
  };
};
