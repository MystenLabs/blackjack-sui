import { GeneralSuiObject } from "@/types/GeneralSuiObject";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { SuiExplorerLink } from "../general/SuiExplorerLink";
import { formatString } from "@/helpers/formatString";
import Link from "next/link";
import { getSuiExplorerLink } from "@/helpers/getSuiExplorerLink";

export const SuiObjectCard = ({
  objectId,
  packageId,
  moduleName,
  structName,
  version,
}: GeneralSuiObject) => {
  return (
    <Link
      href={getSuiExplorerLink({ objectId, type: "object", moduleName })}
      target="_blank"
      rel="noopenner noreferrer"
    >
      <Card className="w-[350px] hover:bg-gray-100">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="text-lg">{formatString(structName, 15)}</div>
            <div className="text-sm">
              <SuiExplorerLink objectId={objectId} type="object" />
            </div>
          </CardTitle>
          <CardDescription className="flex justify-between items-center">
            <div>{formatString(moduleName, 15)}</div>
            <div>
              <SuiExplorerLink
                objectId={packageId}
                type="module"
                moduleName={moduleName}
              />
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between space-x-2">
            <div>Version</div>
            <div className="text-gray-500">{version}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
