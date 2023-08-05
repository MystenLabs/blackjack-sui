"use client";

import { WalletKitProvider } from "@mysten/wallet-kit";
import { Navbar } from "./components/navbar/Navbar";

export default function GlobalContexts({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletKitProvider>
      <Navbar />
      <main className="flex flex-col justify-between items-center p-24 min-h-screen">{children}</main>
    </WalletKitProvider>
  );
}
