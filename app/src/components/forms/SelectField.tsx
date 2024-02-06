import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { FormControl, FormItem, FormLabel, FormMessage } from "../ui/form";

interface SelectFieldProps {
  type?: "single" | "multiple";
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label: string;
  placeholder: string;
  hasError: boolean;
  helperText?: string;
  required?: boolean;
}

interface SelectOption {
  value: string;
  label: string;
}

export const SelectField = ({
  name,
  value,
  onChange,
  options,
  label,
  placeholder,
  hasError,
}: SelectFieldProps) => {
  return (
    <FormItem>
      <FormLabel
        className={hasError ? "text-error-foreground" : "text-gray-700"}
      >
        {label}
      </FormLabel>
      <Select name={name} onValueChange={onChange} value={value}>
        <FormControl>
          <SelectTrigger
            className={`w-full ${hasError ? "border-error-foreground" : ""}`}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {options.map(({ value, label }, index) => (
            <SelectItem key={index} value={value}>
              {label}
            </SelectItem>
          ))}{" "}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  );
};
