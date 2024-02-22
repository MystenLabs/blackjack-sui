"use client";

import { Spinner } from "@/components/general/Spinner";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const NewGamePage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push("/");
  }, []);

  return <Spinner />;
};

export default NewGamePage;