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
    move: "stand",
    suiClient,
    requestObjectId,
    houseDataId: process.env.NEXT_PUBLIC_HOUSE_DATA_ID!,
  })
    .then((resp) => {
      return NextResponse.json(
        {
          message: "Stand executed successfully.",
          txDigest: resp.txDigest,
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
          message: "Error executing stand.",
        },
        {
          status: 400,
        }
      );
    });
};
