"use client";

import { useWalletKit } from "@mysten/wallet-kit";
import { useEffect, useState } from "react";
import { useSui } from "./useSui";

export const useGetOwnedObjects = () => {
  const { currentAccount } = useWalletKit();
  const { provider } = useSui();

  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!!currentAccount?.address) {
      reFetchData();
    } else {
      setData([]);
      setIsLoading(false);
      setIsError(false);
    }
  }, [currentAccount]);

  const reFetchData = async () => {
    setIsLoading(true);
    provider
      .getOwnedObjects({
        owner: currentAccount?.address!,
        limit: 5,
        options: {
          showContent: true,
        },
      })
      .then((res) => {
        console.log(res);
        setData(res.data);
        setIsLoading(false);
        setIsError(false);
      })
      .catch((err) => {
        console.log(err);
        setData([]);
        setIsLoading(false);
        setIsError(true);
      });
  };

  return {
    data: data.map(({ data }) => data),
    isLoading,
    isError,
    reFetchData,
    currentAccount,
  };
};
