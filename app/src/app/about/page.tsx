import 'server-only';

import { Paper } from "@/components/general/Paper";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About PoC Template",
};

export default function About() {
  console.log("about.tsx is on server:", !!process.env.IS_SERVER_SIDE);

  return (
    <Paper>
      <div className="flex flex-col space-y-3">
        <div>
          <div className="text-2xl font-bold">PoC Template</div>
          <div className="text-gray-500">By Mysten Labs</div>
        </div>
        <div>
          This is a NextJS Project, for easier bootstrapping of future PoCs,
          developed by Mysten Labs
        </div>
        <div className="flex items-center space-x-2">
          <div>Source code at: </div>
          <Link
            href="https://github.com/MystenLabs/poc-template-nextjs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500"
          >
            Internal Github Repository
          </Link>
        </div>
      </div>
    </Paper>
  );
}
