"use client";

import { WalletKitProvider } from "@mysten/wallet-kit";
import { Navbar } from "./components/navbar/Navbar";
import { Toaster } from 'react-hot-toast';
export default function GlobalContexts({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletKitProvider>
        <Toaster position="bottom-center" toastOptions={{
            style: {
                border: '1px solid #713200',
                marginBottom: '20%',
                color: '#713200',
            },
        }} />
      <Navbar />
      <main className="flex flex-col justify-between items-center p-2 min-h-screen">{children}</main>
    </WalletKitProvider>
  );
}
