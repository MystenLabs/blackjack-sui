import "../styles/globals.css";
import { Inter } from "next/font/google";
import { ChildrenProps } from "@/types/ChildrenProps";
import { ProvidersAndLayout } from "./ProvidersAndLayout";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: ChildrenProps) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/favicon.ico"></link>
      </head>
      <body className={inter.className}>
        <ProvidersAndLayout>{children}</ProvidersAndLayout>
      </body>
    </html>
  );
}
