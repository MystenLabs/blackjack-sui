import { NextRequest, NextResponse } from "next/server";
import { enokiClient } from "../EnokiClient";

export async function POST(req: NextRequest) {
  try {
    const { digest, signature } = await req.json();

    const executionResult = await enokiClient.executeSponsoredTransaction({
      digest,
      signature,
    });

    return NextResponse.json({
      digest: executionResult.digest,
    });
  } catch (error) {
    console.error("Execution failed:", error);
    return NextResponse.json({ error: "Execution failed" }, { status: 500 });
  }
}
