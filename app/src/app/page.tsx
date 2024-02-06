import "server-only";
import { Paper } from "@/components/general/Paper";
import { LoginForm } from "@/components/forms/LoginForm";
import { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";

export const metadata: Metadata = {
  title: "PoC Template",
  description: "A NextJS app to bootstrap PoCs faster",
};

export default function Home() {
  console.log("page.tsx is on server:", !!process.env.IS_SERVER_SIDE);

  if (process.env.NEXT_PUBLIC_USE_AUTHENTICATION === "1") {
    return (
      <Paper className="max-w-[600px] mx-auto">
        <LoginForm />
      </Paper>
    );
  }

  return <HomePage />;
}
