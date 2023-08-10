import {useState} from 'react';
import {useSui} from './useSui';
import {useWalletKit} from '@mysten/wallet-kit';
import {toast} from 'react-hot-toast';
import {bytesToHex, randomBytes} from '@noble/hashes/utils';
import {Connection, JsonRpcProvider, SuiMoveObject, SuiObjectResponse, TransactionBlock} from '@mysten/sui.js';
import {Simulate} from "react-dom/test-utils";
import play = Simulate.play;
import {Game, GameMessage} from "@/app/types/Game";

import {socket} from "@/app/socket";

export const useGame = () => {

    const connection = new Connection({
        fullnode: process.env.NEXT_PUBLIC_SUI_NETWORK!
    });
    const provider = new JsonRpcProvider(connection);

    const {executeSignedTransactionBlock} = useSui();
    const {signTransactionBlock} = useWalletKit();
    const [isLoading, setIsLoading] = useState(false);
    // const [gameResult, setGameResult] = useState<GameResult | null>(null);
    const [isGameCreated, setIsGameCreated] = useState(false);
    const [currentGameId, setCurrentGameId] = useState<string | null>(null);
    const [betAmount, setBetAmount] = useState<string | null>();
    const [currentGame, setCurrentGame] = useState<Game | null>();

    const BET_AMOUNT = "200000000";


    const handleGameFinale = async (gameId: string): Promise<Game> => {
        console.log("Handle game finale, for game ", gameId);
        const finalGame =  await checkForUpdatedGame(provider, gameId);

        if(finalGame.status == 1){
            if(finalGame.playerSum == 21 && finalGame.playerCards.length == 2){
                toast.success('Congrats! You won with Blackjack!', {duration: 5000, icon: '👍' });
            }else {
                toast.success('Congrats! You won!', {duration: 5000, icon: '👍'});
            }
        }else if(finalGame.status == 2){
            toast.error('House wins, sorry ', {duration: 5000 , icon: '👎'});
        }
        else if(finalGame.status == 3){
            toast.custom('Tie!', {duration: 5000 , icon: '🤝'});
        }
        setCurrentGame(finalGame);
        setIsGameCreated(false);
        return finalGame;
    };

    const handleDeal = async () : Promise<Game> => {
        const game = await checkForUpdatedGame(provider, currentGameId!);
        const playerCards = game.playerCards;
        const dealerCards = game.dealerCards;
        console.log("player cards: ", playerCards);
        console.log("dealer cards: ", dealerCards);
        setCurrentGame(game);
        return game;
    };

    const handleHit = async () : Promise<void> => {
        const tx = new TransactionBlock();
        tx.moveCall({
            target: `${process.env.NEXT_PUBLIC_PACKAGE_ADDRESS}::single_player_blackjack::do_hit`,
            arguments: [
                tx.object(currentGameId!),
                tx.pure(currentGame?.playerSum)
            ],
        });
        const signedTx = await signTransactionBlock({
            transactionBlock: tx,
        });

        console.log('submitting hit request transaction...');
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
                    let gameMessage = new GameMessage();
                    gameMessage.packageId = process.env.NEXT_PUBLIC_PACKAGE_ADDRESS!;
                    gameMessage.gameId = currentGameId!;


                    console.log('hit request transaction successful!');
                    socket.emit('hitRequested', gameMessage);

                } else {
                    setCurrentGameId(null);
                    console.log('hit request transaction failed');
                    toast.error('hit request transaction failed.');
                }
            })
            .catch((err) => {
                setCurrentGameId(null);
                console.log('hit request transaction failed');
                console.log(err);
                toast.error('hit request transaction failed');
            });
    };

    const handleStand = async () : Promise<void> => {
        const tx = new TransactionBlock();
        tx.moveCall({
            target: `${process.env.NEXT_PUBLIC_PACKAGE_ADDRESS}::single_player_blackjack::do_stand`,
            arguments: [
                tx.object(currentGameId!),
                tx.pure(currentGame?.playerSum)
            ],
        });
        const signedTx = await signTransactionBlock({
            transactionBlock: tx,
        });

        console.log('submitting Stand request transaction...');
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
                    let gameMessage = new GameMessage();
                    gameMessage.packageId = process.env.NEXT_PUBLIC_PACKAGE_ADDRESS!;
                    gameMessage.gameId = currentGameId!;


                    console.log('Stand request transaction successful!');
                    socket.emit('StandRequested', gameMessage);

                } else {
                    setCurrentGameId(null);
                    console.log('Stand request transaction failed');
                    toast.error('Stand request transaction failed.');
                }
            })
            .catch((err) => {
                setCurrentGameId(null);
                console.log('Stand request transaction failed');
                console.log(err);
                toast.error('Stand request transaction failed');
            });
    };


    const handlePlayGame = async (userRandomness:string) => {
        setCurrentGame(null);
        setCurrentGameId(null);
        setIsGameCreated(false);

        setBetAmount(BET_AMOUNT);
        setIsLoading(true);
        await handleNewGame(userRandomness)
            .then(() => {
                setIsLoading(false);
            })
            .catch((err) => {
                console.log(err);
                setIsLoading(false);
                toast.error('Something went wrong.');
            });
    };

    const handleNewGame = async (userRandomnessHexString:string) => {

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
                        console.log('game created, waiting for deal...');
                        let gameMessage = new GameMessage();
                        gameMessage.packageId = process.env.NEXT_PUBLIC_PACKAGE_ADDRESS!;
                        gameMessage.gameId = gameObjectId;

                        socket.emit('gameCreated', gameMessage);
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

    const checkForUpdatedGame = async (provider: JsonRpcProvider, gameObjectId: string): Promise<Game> => {
        console.log("Checking for updated game...");
        return provider.getObject({
            id: gameObjectId,
            options:{
                showContent: true,
            }
        }).then((objRes: SuiObjectResponse) => {
            console.log("Res from getObject: " + objRes?.data);
            const gameObject = objRes?.data?.content as SuiMoveObject;
            const playerSum = gameObject.fields.player_sum;
            const game: Game = {
                id: gameObjectId,
                player: gameObject.fields.player,
                status: gameObject.fields.status,
                playerSum: playerSum,
                dealerSum: gameObject.fields.dealer_sum,
                playerCards: gameObject.fields.player_cards,
                dealerCards: gameObject.fields.dealer_cards,
            };
            return game;
        });
    }


    const handleEndGame = () => {
        setIsLoading(false);
    };

    return {
        currentGameId,
        isLoading,
        handlePlayGame,
        handleEndGame,
        handleDeal,
        handleHit,
        handleStand,
        isGameCreated,
        setIsGameCreated,
        betAmount,
        currentGame,
        handleGameFinale
    };
};

