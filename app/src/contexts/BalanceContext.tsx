import { useContext, useEffect, useState, createContext } from "react";
import { ChildrenProps } from "@/types/ChildrenProps";
import BigNumber from "bignumber.js";
import { useZkLogin } from "@mysten/enoki/react";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { useSui } from "@/hooks/useSui";

export const useBalance = () => {
  const context = useContext(BalanceContext);
  return context;
};

interface BalanceContextProps {
  balance: BigNumber;
  isLoading: boolean;
  handleRefreshBalance: () => void;
}

export const BalanceContext = createContext<BalanceContextProps>({
  balance: BigNumber(0),
  isLoading: true,
  handleRefreshBalance: () => {},
});

export const BalanceProvider = ({ children }: ChildrenProps) => {
  const [balance, setBalance] = useState(BigNumber(0));
  const [isLoading, setIsLoading] = useState(false);
  const { suiClient } = useSui();
  const { address } = useZkLogin();

  useEffect(() => {
    if (address) handleRefreshBalance();
  }, [address]);

  const handleRefreshBalance = async () => {
    if (!address) return;
    console.log(`Refreshing balance for ${address}...`);
    setIsLoading(true);
    await suiClient
      .getBalance({
        owner: address!,
      })
      .then((resp) => {
        setIsLoading(false);
        setBalance(
          BigNumber(resp.totalBalance).dividedBy(
            BigNumber(Number(MIST_PER_SUI))
          )
        );
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
        setBalance(BigNumber(0));
      });
  };

  return (
    <BalanceContext.Provider
      value={{ balance, handleRefreshBalance, isLoading }}
    >
      {children}
    </BalanceContext.Provider>
  );
};
