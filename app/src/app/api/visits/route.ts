import { kv } from "@vercel/kv";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const fetchCache = "force-no-store";
export const revalidate = 1;

export const GET = async (request: NextRequest) => {
  // required to avoid caching in the deployed app
  const path = request.nextUrl.searchParams.get("path") || "/";
  revalidatePath(path);

  const pageVisits = await kv.get<number>("pageVisits");
  await kv.set("pageVisits", (pageVisits || 0) + 1);
  const updatedPageVisits = await kv.get("pageVisits");

  return NextResponse.json(
    {
      status: "OK",
      pageVisits: updatedPageVisits,
    },
    { status: 200 }
  );
};
