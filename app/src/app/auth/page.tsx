"use client";

import { Spinner } from "@/components/general/Spinner";
import { useAuthCallback } from "@mysten/enoki/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const AuthPage = () => {
  const router = useRouter();
  const { handled, state } = useAuthCallback();

  useEffect(() => {
    if (handled) {
      router.push("/");
    }
  }, [handled]);

  return <Spinner />;
};

export default AuthPage;
