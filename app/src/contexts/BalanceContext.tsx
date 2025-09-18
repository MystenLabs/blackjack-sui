import {useContext, useEffect, useState, createContext, useCallback} from "react";
import { ChildrenProps } from "@/types/ChildrenProps";
import BigNumber from "bignumber.js";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { useSui } from "@/hooks/useSui";
import {useCurrentAccount} from "@mysten/dapp-kit";

export const useBalance = () => {
  return useContext(BalanceContext);
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
  const currentAccount = useCurrentAccount();

  const handleRefreshBalance = useCallback(async () => {
    if (!currentAccount?.address) return;

    console.log(`Refreshing balance for ${currentAccount.address}...`);
    setIsLoading(true);
    await suiClient
      .getBalance({
        owner: currentAccount.address,
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
  }, [currentAccount, suiClient]);

  useEffect(() => {
    if (currentAccount) {
      handleRefreshBalance();
    }
  }, [currentAccount, handleRefreshBalance]);

  return (
    <BalanceContext.Provider
      value={{ balance, handleRefreshBalance, isLoading }}
    >
      {children}
    </BalanceContext.Provider>
  );
};
