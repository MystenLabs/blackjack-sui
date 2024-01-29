"use client";

import React, { useState } from "react";
import { useGetOwnedObjectsGrouppedByPackage } from "@/hooks/useGetOwnedObjectsGrouppedByPackage";
import { OwnedObjectsCarousel } from "./OwnedObjectsCarousel";
import { SuiExplorerLink } from "../general/SuiExplorerLink";
import { OwnedObjectsDisplayRadio } from "./OwnedObjectsDisplayRadio";
import { OwnedObjectsAccordion } from "./OwnedObjectsAccordion";
import { OwnedObjectsTable } from "./OwnedObjectsTable";
import { Spinner } from "../general/Spinner";
import { ConnectWallet } from "../connectWallet/ConnectWallet";

type Display = "carousel" | "table" | "accordion";

export const OwnedObjects = () => {
  const [display, setDisplay] = useState<Display>("table");
  const { grouppedData, isLoading, isError, reFetchData, currentAccount } =
    useGetOwnedObjectsGrouppedByPackage();

  const handleChangeDisplay = (value: string) => {
    setDisplay(value as Display);
  };

  if (!currentAccount) {
    return <ConnectWallet />;
  }

  if (isLoading) {
    return <Spinner />;
  }
  if (isError) {
    return <h3>Error</h3>;
  }

  const renderList = () => {
    if (display === "carousel") {
      return (
        <div className="flex flex-col space-y-10 w-[100%]">
          {Object.entries(grouppedData).map(([key, value]) => (
            <div className="space-y-5" key={key}>
              <div className="flex space-x-2 items-center font-bold text-xl">
                <div>Package:</div>
                <SuiExplorerLink objectId={key} type="object" />
              </div>
              <OwnedObjectsCarousel key={key} data={value} />
            </div>
          ))}
        </div>
      );
    }

    if (display === "accordion") {
      return <OwnedObjectsAccordion grouppedData={grouppedData} />;
    }

    if (display === "table") {
      return (
        <OwnedObjectsTable
          data={Object.values(grouppedData).flatMap((item) => item)}
        />
      );
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <div className="font-bold text-2xl">Owned Objects</div>
        <OwnedObjectsDisplayRadio
          value={display}
          onChange={handleChangeDisplay}
        />
      </div>
      {renderList()}
    </div>
  );
};
