import {
  Connection,
  Ed25519Keypair, fromB64,
  JsonRpcProvider,
  RawSigner,
  TransactionBlock,
} from "@mysten/sui.js";
import {
  PACKAGE_ADDRESS,
  HOUSE_ADMIN_CAP,
  SUI_NETWORK, ADMIN_SECRET_KEY, deriveBLS_SecretKey,
} from "./config";

import * as bls from "@noble/bls12-381";
import fs from "fs";

let privateKeyArray = Uint8Array.from(Array.from(fromB64(ADMIN_SECRET_KEY!)));

const keypairAdmin = Ed25519Keypair.fromSecretKey(privateKeyArray.slice(1));

const connection = new Connection({
  fullnode: SUI_NETWORK,
});
const provider = new JsonRpcProvider(connection);
const signer = new RawSigner(keypairAdmin, provider);

const initHouseBalance = 10000000000;


console.log("Connecting to SUI network: ", SUI_NETWORK);

const initializeHouseData = async () => {

  const tx = new TransactionBlock();

  const houseCoin = tx.splitCoins(tx.gas, [tx.pure(initHouseBalance)]);
  let blsKeyAsMoveParameter = getBLS_PublicKeyAsMoveParameter();

  tx.moveCall({
    target: `${PACKAGE_ADDRESS}::single_player_blackjack::initialize_house_data`,
    arguments: [
      tx.object(HOUSE_ADMIN_CAP),
      houseCoin,
      tx.pure(Array.from(blsKeyAsMoveParameter))
    ],
  });

  signer
      .signAndExecuteTransactionBlock({
        transactionBlock: tx,
        requestType: "WaitForLocalExecution",
        options: {
          showObjectChanges: true,
          showEffects: true,
        },
      })
      .then(function (res) {
        const status = res?.effects?.status.status;

        console.log("executed! status = ", status);
        if(status === "success"){
          res?.objectChanges?.find((obj) => {
            if(obj.type === "created" && obj.objectType.endsWith("single_player_blackjack::HouseData")){
              const houseDataString = `HOUSE_DATA_ID=${obj.objectId}\n`;
              const appHouseDataString = `NEXT_PUBLIC_HOUSE_DATA_ID=${obj.objectId}\n`;
              console.log(houseDataString);
              fs.writeFileSync("./tx_res.json", JSON.stringify(res));
              fs.appendFileSync("./.env", houseDataString);
              fs.appendFileSync("../app/.env", appHouseDataString);
            }
          });
          process.exit(0);
        }
        if(status == "failure"){
          console.log("Error = ", res?.effects);
          process.exit(1);
        }
      });

};


initializeHouseData();


//---------------------------------------------------------
/// Helper Functions
//---------------------------------------------------------

function getBLS_PublicKeyAsMoveParameter() {
  const derived_bls_key = deriveBLS_SecretKey(ADMIN_SECRET_KEY!);
  return bls.getPublicKey(derived_bls_key);
}

