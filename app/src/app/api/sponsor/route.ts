import { NextRequest, NextResponse } from "next/server";
import { enokiClient } from "../EnokiClient";
import { Transaction } from "@mysten/sui/transactions";

export async function POST(req: NextRequest) {
  try {
    const { transactionKindBytes, sender } = await req.json();

    const sponsored = await enokiClient.createSponsoredTransaction({
      network: process.env.NEXT_PUBLIC_SUI_NETWORK_NAME as
        | "mainnet"
        | "testnet"
        | "devnet",
      transactionKindBytes,
      sender: sender,
      allowedAddresses: [sender],
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
