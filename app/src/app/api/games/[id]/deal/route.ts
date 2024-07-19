import { doInitialDeal } from "@/app/api/services/doInitialDeal";
import { SuiClient } from "@mysten/sui/client";
import { NextRequest, NextResponse } from "next/server";

// Waits for the transaction block that created the game
// And then executes the initial deal
// It returns the txDigest, so that the UI will wait for this transaction block before re-fetching the game
export const POST = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const suiClient = new SuiClient({
    url: process.env.NEXT_PUBLIC_SUI_NETWORK!,
  });
  const { id: gameId } = params;
  const { txDigest } = await req.json();

  await suiClient.waitForTransaction({
    digest: txDigest,
    timeout: 10_000,
  });

  return doInitialDeal({
    gameId,
    suiClient,
    houseDataId: process.env.NEXT_PUBLIC_HOUSE_DATA_ID!,
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
