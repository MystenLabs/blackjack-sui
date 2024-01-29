import React, { useMemo } from "react";
import { useGetOwnedObjects } from "./useGetOwnedObjects";
import { GeneralSuiObject } from "@/types/GeneralSuiObject";

export interface GrouppedOwnedObjects {
  [key: string]: GeneralSuiObject[];
}

export const useGetOwnedObjectsGrouppedByPackage = () => {
  const { data, isLoading, isError, reFetchData, currentAccount } =
    useGetOwnedObjects();

  const grouppedData = useMemo<GrouppedOwnedObjects>(() => {
    const grouppedData: any = {};
    data.forEach((datum) => {
      const { packageId } = datum;
      if (!grouppedData[packageId]) {
        grouppedData[packageId] = [];
      }
      grouppedData[packageId].push(datum);
    });
    return grouppedData;
  }, [data]);

  return {
    grouppedData,
    isLoading,
    isError,
    reFetchData,
    currentAccount,
  };
};
