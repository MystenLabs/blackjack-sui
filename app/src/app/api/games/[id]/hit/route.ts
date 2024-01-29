import { houseHitOrStand } from "@/app/api/services/houseHitOrStand";
import { SuiClient } from "@mysten/sui.js/client";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { id: gameId } = params;
  const suiClient = new SuiClient({
    url: process.env.NEXT_PUBLIC_SUI_NETWORK!,
  });
  const { requestObjectId } = await req.json();

  return houseHitOrStand({
    gameId,
    move: "hit",
    suiClient,
    requestObjectId,
    houseDataId: process.env.NEXT_PUBLIC_HOUSE_DATA_ID!,
  })
    .then((resp) => {
      return NextResponse.json(
        {
          message: "Hit executed successfully.",
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
          message: "Error executing hit.",
        },
        {
          status: 400,
        }
      );
    });
};
