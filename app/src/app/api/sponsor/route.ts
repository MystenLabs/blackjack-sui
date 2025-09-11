import { NextRequest, NextResponse } from "next/server";
import { enokiClient } from "../EnokiClient";
import { Transaction } from "@mysten/sui/transactions";
import serverConfig from "@/config/serverConfig";
import {getAddress} from "@/app/api/helpers/getAddress";
import {firstDeal} from "@/__generated__/blackjack/single_player_blackjack";
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
          getAddress(serverConfig.ADMIN_SECRET_KEY),
      ],
      allowedMoveCallTargets: [
        // These are only player interactions
        getMoveTarget('single_player_blackjack', 'do_hit'),
        getMoveTarget('single_player_blackjack', 'do_stand'),
        getMoveTarget('single_player_blackjack', 'place_bet_and_create_game'),
        getMoveTarget('counter_nft', 'mint_and_transfer'),
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
