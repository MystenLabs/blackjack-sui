import { NextRequest, NextResponse } from "next/server";
import { enokiClient } from "../EnokiClient";
import serverConfig from "@/config/serverConfig";
import getMoveTarget from "@/helpers/getMoveTarget";

export async function POST(req: NextRequest) {
  try {
    const { transactionKindBytes, sender } = await req.json();

    const sponsored = await enokiClient.createSponsoredTransaction({
      network: serverConfig.NEXT_PUBLIC_SUI_NETWORK_NAME,
      transactionKindBytes,
      sender: sender,
      allowedAddresses: [
          sender,
      ],
      allowedMoveCallTargets: [
        // These are only player interactions
        getMoveTarget('single_player_blackjack', 'do_hit'),
        getMoveTarget('single_player_blackjack', 'do_stand'),
        getMoveTarget('single_player_blackjack', 'place_bet_and_create_game'),
      ],
    });

    return NextResponse.json({
      bytes: sponsored.bytes,
      digest: sponsored.digest,
    });
  } catch (error) {
    console.error("Sponsorship failed:", error);
    return NextResponse.json({ error: "Sponsorship failed" }, { status: 500 });
  }
}
