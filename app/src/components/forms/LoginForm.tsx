"use client";

import { USER_ROLES } from "@/constants/USER_ROLES";
import React, { useEffect } from "react";
import { Button } from "../ui/button";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { LoginFormSchema } from "@/components/forms/LoginFormSchema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField } from "@/components/ui/form";
import { TextField } from "./TextField";
import { PaperPlaneIcon } from "@radix-ui/react-icons";
import { useAuthentication } from "@/contexts/Authentication";
import { useRouter } from "next/navigation";
import { Spinner } from "../general/Spinner";

export const LoginForm = () => {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, handleLoginAs } = useAuthentication();

  const loginForm = useForm<z.infer<typeof LoginFormSchema>>({
    resolver: zodResolver(LoginFormSchema as any),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handleSubmit = () => {
    const { username, password } = loginForm.getValues();
    if (password !== "12345") {
      toast.error("Invalid credentials");
      return;
    }
    if (username === "admin") {
      handleLoginAs(USER_ROLES.ROLE_1);
      toast.success("Welcome back!");
    } else if (username === "moderator") {
      handleLoginAs(USER_ROLES.ROLE_2);
      toast.success("Welcome back!");
    } else if (username === "member") {
      handleLoginAs(USER_ROLES.ROLE_3);
      toast.success("Welcome back!");
    } else {
      toast.error("Invalid credentials");
    }
  };

  useEffect(() => {
    if (user.role !== USER_ROLES.ROLE_4 && !isAuthLoading) {
      router.push(`/${user.role}`);
    }
  }, [user, isAuthLoading]);

  if (isAuthLoading || user.role !== USER_ROLES.ROLE_4) {
    return <Spinner />;
  }

  return (
    <div className="space-y-5">
      <h3 className="font-semibold text-lg text-center">Login</h3>
      <Form {...loginForm}>
        <form
          onSubmit={loginForm.handleSubmit(handleSubmit)}
          className="space-y-8"
        >
          <FormField
            control={loginForm.control}
            name="username"
            render={({ field }) => (
              <TextField
                {...field}
                type="text"
                label="Username"
                placeholder="Enter username..."
                hasError={!!loginForm.formState.errors["username"]?.message}
              />
            )}
          />
          <FormField
            control={loginForm.control}
            name="password"
            render={({ field }) => (
              <TextField
                {...field}
                type="password"
                label="Password"
                placeholder="Enter your password..."
                hasError={!!loginForm.formState.errors["password"]?.message}
              />
            )}
          />
          <Button
            type="submit"
            size="default"
            className="flex space-x-2 items-center w-full"
          >
            <div>Login</div>
            <PaperPlaneIcon className="w-4 h-4" />
          </Button>
        </form>
      </Form>
    </div>
  );
};
