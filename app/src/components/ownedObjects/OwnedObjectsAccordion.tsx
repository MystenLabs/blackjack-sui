import React from "react";
import { Accordion, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { AccordionContent } from "@radix-ui/react-accordion";
import { GrouppedOwnedObjects } from "@/hooks/useGetOwnedObjectsGrouppedByPackage";
import { SuiExplorerLink } from "../general/SuiExplorerLink";
import { SuiObjectCard } from "./SuiObjectCard";

interface OwnedObjectsAccordionProps {
  grouppedData: GrouppedOwnedObjects;
}
export const OwnedObjectsAccordion = ({
  grouppedData,
}: OwnedObjectsAccordionProps) => {
  return (
    <Accordion type="multiple" className="flex flex-col space-y-2 w-[100%]">
      {Object.entries(grouppedData).map(([key, value]) => (
        <AccordionItem value={key} key={key}>
          <AccordionTrigger className="flex space-x-2 items-center font-bold text-xl">
            <div>Package:</div>
            <SuiExplorerLink objectId={key} type="object" />
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex w-full flex-wrap">
              {value.map((item, index) => (
                <div className="m-2" key={index}>
                  <SuiObjectCard {...item} />
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
