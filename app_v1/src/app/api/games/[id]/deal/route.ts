import { doInitialDeal } from "@/app/api/services/doInitialDeal";
import { SuiClient } from "@mysten/sui.js/client";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const suiClient = new SuiClient({
    url: process.env.NEXT_PUBLIC_SUI_NETWORK!,
  });
  const { id: gameId } = params;

  return doInitialDeal({
    gameId,
    suiClient,
    houseDataId: process.env.NEXT_PUBLIC_HOUSE_DATA_ID!,
  })
    .then((resp) => {
      return NextResponse.json(
        {
          message: "Initial deal executed successfully.",
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
