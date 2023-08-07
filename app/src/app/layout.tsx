import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import GlobalContexts from "./globalContexts";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sui Blackjack",
  description: "A simple Blackjack game built by taking advantage the Sui Framework",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GlobalContexts>
          {children}
        </GlobalContexts>
      </body>
    </html>
  );
}
