"use client";

import { LargeScreenLayout } from "@/components/layouts/LargeScreenLayout";
import { MobileLayout } from "@/components/layouts/MobileLayout";
import { AuthenticationProvider } from "@/contexts/Authentication";
import { useRegisterServiceWorker } from "@/hooks/useRegisterServiceWorker";
import { ChildrenProps } from "@/types/ChildrenProps";
import { WalletKitProvider } from "@mysten/wallet-kit";
import React from "react";
import { Toaster } from "react-hot-toast";

export const ProvidersAndLayout = ({ children }: ChildrenProps) => {
  const _ = useRegisterServiceWorker();

  return (
    <WalletKitProvider>
      <AuthenticationProvider>
        <main
          className={`min-h-screen w-screen`}
          style={{
            backgroundImage: "url('/background.svg')",
            backgroundSize: "cover",
          }}
        >
          <LargeScreenLayout>{children}</LargeScreenLayout>
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 5000,
            }}
          />
        </main>
      </AuthenticationProvider>
    </WalletKitProvider>
  );
};
