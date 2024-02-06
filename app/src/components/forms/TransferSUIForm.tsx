"use client";

import React from "react";
import { PaperPlaneIcon } from "@radix-ui/react-icons";
import { useTransferSUI } from "@/hooks/useTransferSUI";
import { LoadingButton } from "../general/LoadingButton";
import { useWalletKit } from "@mysten/wallet-kit";
import { ConnectWallet } from "../connectWallet/ConnectWallet";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TransferSUIFormSchema } from "@/components/forms/TransferSUIFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField } from "../ui/form";
import { TextField } from "./TextField";
import { SelectField } from "./SelectField";

export const TransferSUIForm = () => {
  const { currentAccount } = useWalletKit();
  const { isLoading, handleTransferSUI } = useTransferSUI();

  const transferForm = useForm<z.infer<typeof TransferSUIFormSchema>>({
    resolver: zodResolver(TransferSUIFormSchema as any),
    defaultValues: {
      recipient: "",
      amount: 0,
      category: "",
      description: "",
    },
  });

  const handleSubmit = () => {
    const values = transferForm.getValues();
    console.log(values);
    handleTransferSUI({
      amount: values.amount as number,
      recipient: values.recipient,
      refresh: transferForm.reset,
    });
  };

  if (!currentAccount) {
    return <ConnectWallet />;
  }

  return (
    <div className="space-y-6">
      <div className="text-xl font-bold">Transfer SUI</div>
      <Form {...transferForm}>
        <form
          onSubmit={transferForm.handleSubmit(handleSubmit)}
          className="grid grid-cols-2 gap-4"
        >
          <div className="col-span-2">
            <FormField
              control={transferForm.control}
              name="recipient"
              render={({ field }) => (
                <TextField
                  {...field}
                  type="text"
                  label="Recipient"
                  placeholder="Enter recipient's address..."
                  hasError={
                    !!transferForm.formState.errors["recipient"]?.message
                  }
                />
              )}
            />
          </div>
          <div className="col-span-1">
            <FormField
              control={transferForm.control}
              name="amount"
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Amount (SUI)"
                  placeholder="Enter Amount..."
                  hasError={!!transferForm.formState.errors["amount"]?.message}
                />
              )}
            />
          </div>
          <div className="col-span-1">
            <FormField
              control={transferForm.control}
              name="category"
              render={({ field }) => (
                <SelectField
                  {...field}
                  type="single"
                  label="Category"
                  placeholder="Select a category..."
                  hasError={
                    !!transferForm.formState.errors["category"]?.message
                  }
                  options={[
                    { value: "category_1", label: "Category 1" },
                    { value: "category_2", label: "Category 2" },
                  ]}
                />
              )}
            />
          </div>
          <div className="col-span-2">
            <FormField
              control={transferForm.control}
              name="description"
              render={({ field }) => (
                <TextField
                  {...field}
                  type="text"
                  label="Description"
                  placeholder="Enter description..."
                  hasError={
                    !!transferForm.formState.errors["description"]?.message
                  }
                  multiline
                />
              )}
            />
          </div>
          <div className="col-span-2">
            <LoadingButton
              isLoading={isLoading}
              type="submit"
              className="flex w-full space-x-3 items-center"
            >
              <div>Transfer</div>
              <PaperPlaneIcon className="w-4 h-4" />
            </LoadingButton>
          </div>
        </form>
      </Form>
    </div>
  );
};
