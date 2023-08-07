
import { useState } from 'react';
import { useSui } from './useSui';
import { useWalletKit } from '@mysten/wallet-kit';
import { toast } from 'react-hot-toast';
import { bytesToHex, randomBytes } from '@noble/hashes/utils';
import { TransactionBlock } from '@mysten/sui.js';

export const useGame = () => {
    const { executeSignedTransactionBlock } = useSui();
    const { signTransactionBlock } = useWalletKit();
    const [isLoading, setIsLoading] = useState(false);
    // const [gameResult, setGameResult] = useState<GameResult | null>(null);
    const [isGameCreated, setIsGameCreated] = useState(false);
    const [currentGameId, setCurrentGameId] = useState<string | null>(null);
    const [betAmount, setBetAmount] = useState<string | null>();

    const BET_AMOUNT = "1000000000";
    const handlePlayGame = async () => {
        setBetAmount(BET_AMOUNT);
        setIsLoading(true);
        await handleNewGame()
            .then(() => {
                setIsLoading(false);
            })
            .catch((err) => {
                console.log(err);
                setIsLoading(false);
                toast.error('Something went wrong.');
            });
    };

    const handleNewGame = async () => {
        const userRandomness = randomBytes(16);
        const userRandomnessHexString = bytesToHex(userRandomness);

        const tx = new TransactionBlock();
        let coin = tx.splitCoins(tx.gas, [tx.pure(Number(BET_AMOUNT))]);
        tx.moveCall({
            target: `${process.env.NEXT_PUBLIC_PACKAGE_ADDRESS}::single_player_blackjack::place_bet_and_create_game`,
            arguments: [
                tx.pure(userRandomnessHexString),
                coin,
                tx.object(process.env.NEXT_PUBLIC_HOUSE_DATA_ID!),
            ],
        });
        const signedTx = await signTransactionBlock({
            transactionBlock: tx,
        });

        console.log('creating game...');
        return executeSignedTransactionBlock({
            signedTx,
            requestType: 'WaitForLocalExecution',
            options: {
                showEffects: true,
                showEvents: true,
            },
        })
            .then((resp) => {
                console.log(resp);
                if (resp.effects?.status.status === 'success') {
                    const createdObjects = resp.effects?.created;
                    const createdGame = createdObjects?.[0];
                    const gameObjectId = createdGame?.reference.objectId;

                    if (!!gameObjectId) {
                        setCurrentGameId(gameObjectId);
                        setIsGameCreated(true);
                        console.log("Game created");
                    }

                } else {
                    setCurrentGameId(null);
                    console.log('game creation failed');
                    toast.error('Sorry, game could not be played.');
                }
            })
            .catch((err) => {
                setCurrentGameId(null);
                console.log('game creation failed');
                console.log(err);
                toast.error('Something went wrong, game could not be started.');
            });
    };

    const handleEndGame = () => {
        setIsLoading(false);
    };

    return {
        currentGameId,
        isLoading,
        handlePlayGame,
        handleEndGame,
        isGameCreated,
        betAmount
    };
};
