import React from "react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";

interface OwnedObjectsDisplayRadioProps {
  value: string;
  onChange: (value: string) => void;
}

export const OwnedObjectsDisplayRadio = ({
  value,
  onChange,
}: OwnedObjectsDisplayRadioProps) => {
  return (
    <RadioGroup defaultValue="table" value={value} onValueChange={onChange}>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="table" id="table" />
        <Label htmlFor="table">Table</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="carousel" id="carousel" />
        <Label htmlFor="carousel">Carousel</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="accordion" id="accordion" />
        <Label htmlFor="accordion">Accordion</Label>
      </div>
    </RadioGroup>
  );
};
