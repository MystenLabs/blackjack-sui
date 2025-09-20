import { doInitialDeal } from "@/app/api/services/doInitialDeal";
import { NextRequest, NextResponse } from "next/server";
import { suiClient } from "@/helpers/suiClient";

// Waits for the transaction block that created the game
// And then executes the initial deal
// It returns the txDigest, so that the UI will wait for this transaction block before re-fetching the game
export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: gameId } = await params;
  const { txDigest } = await req.json();

  await suiClient.waitForTransaction({
    digest: txDigest,
    timeout: 10_000,
  });

  return doInitialDeal({
    gameId,
    suiClient,
  })
    .then((resp) => {
      const { txDigest } = resp;
      return NextResponse.json(
        {
          message: "Initial deal executed successfully.",
          txDigest,
        },
        {
          status: 200,
        }
      );
    })
    .catch((err) => {
      console.log(err);
      return NextResponse.json(
        {
          message: "Error executing initial deal.",
        },
        {
          status: 400,
        }
      );
    });
};
