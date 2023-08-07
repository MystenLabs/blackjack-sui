import type { VercelRequest, VercelResponse } from '@vercel/node';

import {Connection, JsonRpcProvider, SuiEvent} from '@mysten/sui.js';

const FULL_NODE = process.env.NEXT_PUBLIC_SUI_NETWORK!;

console.log("Fullnode = ", FULL_NODE);
const connection = new Connection({
    fullnode: FULL_NODE!,
});
let provider = new JsonRpcProvider(connection);


const listenForStandRequests = async () => {

    provider.subscribeEvent({
        filter: {
            MoveEventType: `${process.env.NEXT_PUBLIC_PACKAGE_ADDRESS}::single_player_blackjack::GameCreatedEvent`
        },
        onMessage(event: SuiEvent) {

            const eventGameId = event.parsedJson?.game_id;
            console.log("GAME_ID: ", eventGameId);


            //doInitialDeal(event);
        }
    }).then((subscriptionId) => {
        console.log("Subscriber subscribed. SubId = ", subscriptionId);
    });

}
