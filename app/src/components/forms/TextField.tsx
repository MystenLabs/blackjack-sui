import React from "react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface TextFieldProps {
  type: "text" | "number" | "password";
  name: string;
  value: string | number;
  onChange: (event: any) => void;
  label: string;
  placeholder: string;
  hasError: boolean;
  multiline?: boolean;
}

export const TextField = ({
  type,
  name,
  value,
  onChange,
  label,
  placeholder,
  hasError,
  multiline = false,
}: TextFieldProps) => {
  const component = !!multiline ? <Textarea /> : <Input />;

  return (
    <FormItem>
      <FormLabel
        className={hasError ? "text-error-foreground" : "text-gray-700"}
      >
        {label}
      </FormLabel>
      <FormControl>
        {React.cloneElement(component, {
          name,
          onChange,
          value,
          type,
          placeholder,
          className: hasError ? "border-error-foreground" : "",
        })}
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};
