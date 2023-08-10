import React, {useEffect, useState} from 'react';
import {useGame} from "@/app/hooks/useGame";

import {socket} from "@/app/socket";
import {GameMessage} from "@/app/types/Game";
import {toast} from "react-hot-toast";
import Modal from 'react-modal';
import {bytesToHex} from "@noble/hashes/utils";


const BlackjackBoard = () => {
    const [playerHand, setPlayerHand] = useState<Card[]>([]);
    const [playerTotal, setPlayerTotal] = useState<number>(0);
    const [dealerHand, setDealerHand] = useState<Card[]>([]);
    const [dealerTotal, setDealerTotal] = useState<number>(0);
    const [userCreatedRandomness, setUserCreatedRandomness] = useState<number[]>([]);
    const [modalIsOpen, setIsOpen] = React.useState(false);
    const [deck, setDeck] = useState<Card[]>([]);
    const [randomnessHex, setRandomnessHex] = useState<string>("");
    const [adequateRandomnessGathered, setAdequateRandomnessGathered] = useState<boolean>(false);

    const {
        currentGameId,
        handlePlayGame,
        isGameCreated,
        setIsGameCreated,
        handleDeal,
        handleHit,
        handleStand,
        currentGame,
        handleGameFinale
    } = useGame();

    const suits = ["Clubs", "Diamonds", "Hearts", "Spades"];
    const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

    const cards: Map<number, Card> = new Map();

    function openNewGameModal() {
        setIsOpen(true);
        setRandomnessHex("");
        setUserCreatedRandomness([]);
        setAdequateRandomnessGathered(false);
    }

    function createNewGame() {
        setIsOpen(false);

        setPlayerHand([]);
        setDealerHand([]);
        setPlayerTotal(0);
        setDealerTotal(0);

        const u8Array = Uint8Array.from(userCreatedRandomness);
        const userRandomnessHexString = bytesToHex(u8Array);
        setRandomnessHex(userRandomnessHexString);

        handlePlayGame(userRandomnessHexString);
    }

    useEffect(() => {
        socket.on("hitExecuted", (...args) => {
            const gameMessage: GameMessage = args[0];

            if (currentGameId && gameMessage.gameId == currentGameId) {
                console.log("hitExecuted");
                console.log("Current game id: ", currentGameId);
                let playerCards = gameMessage.playerCards;
                console.log("playerCards ", playerCards);

                const playerHand: Card[] = [];
                playerCards?.forEach((cardIndex) => {
                    playerHand.push(cards.get(cardIndex)!);
                });
                console.log("New player hand:", playerHand);
                setPlayerHand(playerHand);
                setPlayerTotal(gameMessage.playerScore);
                if (gameMessage.playerScore > 21) {
                    toast.error('Busted! ', {duration: 5000, icon: '👎'});
                    setIsGameCreated(false);
                }
            }
        });

    }, [socket, currentGameId, setPlayerHand, setPlayerTotal, setIsGameCreated]);

    useEffect(() => {
        socket.on("StandExecuted", (...args) => {
            const gameMessage: GameMessage = args[0];
            if (currentGameId && gameMessage.gameId == currentGameId) {
                console.log("StandExecuted");
                console.log("Current game id: ", currentGameId);

                handleGameFinale(currentGameId!).then((finalGame) => {
                    setPlayerTotal(finalGame?.playerSum!);
                    setDealerTotal(finalGame?.dealerSum!);

                    const dealerHand: Card[] = [];

                    finalGame?.dealerCards.forEach((cardIndex) => {
                        dealerHand.push(cards.get(cardIndex)!);
                    });

                    setDealerHand(dealerHand);

                    toast.custom("Game ended");

                });
            }
        });

    }, [socket, currentGameId]);


    const generateDeck = () => {
        const newDeck: Card[] = [];
        let i: number = 0;
        for (const suit of suits) {
            for (const value of values) {
                const card = {
                    index: i,
                    suit: suit,
                    value: value,
                };
                newDeck.push(card);
                cards.set(i, card);
                i++;
            }
        }
        return newDeck;
    };

    const dealInitialHands = async () => {
        const newDeck = generateDeck();
        setDeck(newDeck);

        const updatedGame = await handleDeal();

        const playerInitialHand: Card[] = [];
        updatedGame?.playerCards.forEach((cardIndex) => {
            playerInitialHand.push(cards.get(cardIndex)!);
        });

        setPlayerHand(playerInitialHand);

        const dealerInitialHand: Card[] = [];

        updatedGame?.dealerCards.forEach((cardIndex) => {
            dealerInitialHand.push(cards.get(cardIndex)!);
        });

        setDealerHand(dealerInitialHand);

        setPlayerTotal(updatedGame.playerSum!); // calculateHandValue(playerHand);
        setDealerTotal(updatedGame.dealerSum!); // calculateHandValue(dealerHand);

        if (updatedGame.playerSum! == 21) {
            await handleGameFinale(updatedGame.id);
        }

    };

    useEffect(() => {
        socket.on("dealExecuted", (...args) => {
            const gameMessage: GameMessage = args[0];
            if (currentGameId && gameMessage.gameId == currentGameId) {
                console.log("dealExecuted");
                dealInitialHands();
            }
        });

    }, [socket, currentGameId, dealInitialHands]);


    type Card = {
        index: number;
        suit: string;
        value: string;
    }

    const getSuitSymbol = (suit: string) => {
        switch (suit) {
            case "Hearts":
                return "♥";
            case "Diamonds":
                return "♦";
            case "Clubs":
                return "♣";
            case "Spades":
                return "♠";
            default:
                return "";
        }
    };

    const getSuitColor = (suit: string) => {
        switch (suit) {
            case "Hearts":
                return "text-red-600";
            case "Diamonds":
                return "text-red-600";
            default:
                return "";
        }
    };

    const handleMouseMove = (event) => {
        // 👇 Get mouse position relative to element
        const localX = event.clientX - event.target.offsetLeft;
        const localY = event.clientY - event.target.offsetTop;

        if (userCreatedRandomness.length < 32) {
            const sum = localX * localY * 1223;
            const randomVal = Math.floor(Math.random() * sum) % 256;
            userCreatedRandomness?.push(randomVal);
        } else {
            setAdequateRandomnessGathered(true);
        }
    };

    function getRandomnessArray() {
        return "[".concat(userCreatedRandomness.toString()).concat("]");
    }


    Modal.setAppElement("#bj");

    return (
        <div id="bj" className="flex flex-col items-center mt-10">

            <Modal
                isOpen={modalIsOpen}
                onRequestClose={createNewGame}
                contentLabel="Randomness"
            >
                <h2 className="text-1xl font-bold mb-1 pb-5">Move the mouse cursor in the white area to gather some
                    entropy...</h2>
                <p className="text-black font-normal mt-5">
                    User Randomness: {getRandomnessArray()}
                </p>
                <form
                    className="h-full flex flex-col justify-center items-center"
                    onMouseMove={handleMouseMove}>
                    <div>
                        {adequateRandomnessGathered ? (
                            <button className="bg-red-400 text-white px-4 py-2 rounded-md"
                                    onClick={createNewGame}>Ready!
                            </button>
                        ) : null}
                    </div>
                </form>
            </Modal>

            <h2 className="text-1xl font-bold mb-1">Play now</h2>

            <div className="flex mt-4 mb-5 space-x-4">
                <button
                    className="bg-red-400 text-white px-4 py-2 rounded-md"
                    onClick={() => openNewGameModal()}
                >
                    New Game
                </button>

            </div>

            {randomnessHex.length > 0 ? (
                <div className="flex mt-4 mb-5 space-x-4">

                </div>
            ) : null}
            <div className="flex flex-col space-y-4"> {/* Use flex-col and space-y-4 to stack the columns */}
                <div className="flex items-center">
                    <h2 className="font-semibold">Dealer</h2>
                </div>
                <div className="flex space-x-2">
                    {dealerHand.map((card: Card, index: number) => (
                        <div
                            key={index}
                            className="bg-white p-4 rounded-md border flex flex-col items-start h-40 w-32"
                        >
                            <p
                                className={`text-2xl leading-3 ${getSuitColor(card.suit)}`} // Apply color based on the suit
                            >
                                {card.value}
                            </p>
                            <p
                                className={`text-2xl ${getSuitColor(card.suit)}`} // Apply the same color to suit symbol
                            >
                                {getSuitSymbol(card.suit)}
                            </p>
                            <div className="flex pl-7">
                                <p
                                    className={`text-6xl ${getSuitColor(card.suit)} `}
                                >
                                    {getSuitSymbol(card.suit)}
                                </p>
                            </div>

                        </div>
                    ))}
                </div>
                <p>Sum: {dealerTotal}</p>
            </div>
            <hr className="w-80 border-t-2 border-gray-300 my-4"/>

            <div className="flex flex-col space-y-4 mt-10"> {/* Use flex-col and space-y-4 to stack the columns */}
                <div className="flex items-center">
                    <h2 className="font-semibold">Player</h2>
                </div>
                <div className="flex space-x-10">
                    {playerHand.map((card: Card, index: number) => (
                        <div
                            key={index}
                            className="bg-white p-4 rounded-md border flex flex-col items-start h-40 w-32"
                        >
                            <p
                                className={`text-2xl leading-3 ${getSuitColor(card.suit)}`} // Apply color based on the suit
                            >
                                {card.value}
                            </p>
                            <p
                                className={`text-2xl ${getSuitColor(card.suit)}`} // Apply the same color to suit symbol
                            >
                                {getSuitSymbol(card.suit)}
                            </p>
                            <div className="flex pl-7">
                                <p
                                    className={`text-6xl ${getSuitColor(card.suit)} `}
                                >
                                    {getSuitSymbol(card.suit)}
                                </p>
                            </div>

                        </div>
                    ))}
                </div>
                <p>Sum: {playerTotal}</p>
            </div>


            {/*Game buttons should appear only when the game is created*/}
            {playerHand.length > 0 ? (
                <div>
                    <div className="flex mt-10 space-x-4 justify-center">
                        <button
                            className="bg-blue-500 text-white px-4 py-2 rounded-md"
                            onClick={() => handleHit()}
                        >
                            Hit
                        </button>

                        <button
                            className="bg-green-500 text-white px-4 py-2 rounded-md"
                            disabled={!isGameCreated}
                            onClick={() => handleStand()}
                        >
                            Stand
                        </button>

                    </div>

                    {currentGame?.id ? (
                        <div>
                        <div className="flex mt-4 mb-10 space-x-4 justify-center">
                            <a href={`https://suiexplorer.com/object/${currentGame?.id}?network=https%3A%2F%2Ffullnode.devnet.sui.io%3A443`}
                               className="hover:text-blue-600"
                               target="_blank">
                                Game on Explorer
                            </a>

                        </div>
                            <div className="flex mt-4 mb-10 space-x-4 justify-center">
                                <p className="text-cyan-600 font-normal mb-5 justify-center">
                                    User Randomness: {getRandomnessArray()}
                                </p>
                            </div>
                        </div>
                    ) : null}
                </div>

            ) : null}

        </div>
    );
};

export default BlackjackBoard;
