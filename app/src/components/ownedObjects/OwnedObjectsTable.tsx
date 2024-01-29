import React from "react";
import { GeneralSuiObject } from "@/types/GeneralSuiObject";
import { SuiExplorerLink } from "../general/SuiExplorerLink";
import { GeneralTable } from "../general/GeneralTable";
import { formatString } from "@/helpers/formatString";
import { Badge } from "../ui/badge";

interface OwnedObjectsTableProps {
  data: GeneralSuiObject[];
}

export const OwnedObjectsTable = ({ data }: OwnedObjectsTableProps) => {
  const mapDatumToRow = ({
    objectId,
    moduleName,
    structName,
    packageId,
    version,
  }: GeneralSuiObject) => ({
    id: objectId,
    columns: [
      <SuiExplorerLink
        key={`${objectId}-0`}
        type="object"
        objectId={objectId}
        className="text-primary"
      />,
      moduleName,
      <Badge
        key={`${objectId}-1`}
        variant={
          structName.includes("Cap") || structName.includes("Publisher")
            ? "success"
            : structName.includes("Coin")
            ? "warning"
            : structName.includes("Display")
            ? "secondary"
            : "default"
        }
        className="font-normal"
      >
        {formatString(structName, 20)}
      </Badge>,
      <SuiExplorerLink
        key={`${objectId}-2`}
        type="object"
        objectId={packageId}
        className="justify-end"
      />,
      version,
    ],
    isSelected: false,
  });

  return (
    <GeneralTable
      caption="Your Owned Objects."
      headers={["Object", "Module", "Package", "Struct", "Version"]}
      state={{
        page: 0,
        pageSize: 10,
        isLoading: false,
      }}
      rows={data.map((datum) => mapDatumToRow(datum))}
    />
  );
};
