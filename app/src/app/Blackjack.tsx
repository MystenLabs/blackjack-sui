import React, {useState} from 'react';
import {useGame} from "@/app/hooks/useGame";

import {socket} from "@/app/socket";
import {GameMessage} from "@/app/types/Game";

const BlackjackBoard = () => {
    const [playerHand, setPlayerHand] = useState<Card[]>([]);
    const [dealerHand, setDealerHand] = useState<Card[]>([]);
    const [deck, setDeck] = useState<Card[]>([]);
    const {handlePlayGame, isGameCreated, handleDeal, currentGame} = useGame();

    const suits = ["Clubs", "Diamonds", "Hearts", "Spades"];
    const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

    const cards: Map<number, Card> = new Map();


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
    };


    function hit(hand: Card[], setHand: (hand: Card[]) => void) {


        const newHand:Card[] = [];

        setDeck([...deck]);
        setHand(newHand);
    }

    type Card = {
        index: number;
        suit: string;
        value: string;
    }

    const calculateHandValue = (hand: Array<Card>) => {
        let totalValue = 0;
        let hasAce = false;

        for (const card of hand) {
            if (card.value === "A") {
                hasAce = true;
            }
            totalValue += getValue(card.value);
        }

        if (hasAce && totalValue + 10 <= 21) {
            totalValue += 10;
        }

        return totalValue;
    };

    const getValue = (value: string) => {
        if (["K", "Q", "J"].includes(value)) {
            return 10;
        } else if (value === "A") {
            return 1;
        } else {
            return parseInt(value, 10);
        }
    };

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

    const playerTotal = currentGame?.playerSum; // calculateHandValue(playerHand);
    const dealerTotal = currentGame?.dealerSum; // calculateHandValue(dealerHand);

    return (
        <div className="flex flex-col items-center mt-10">

            <h2 className="text-1xl font-bold mb-1">Play now, bet is 1 Sui</h2>

            <div className="flex mt-4 mb-10 space-x-4">
                <button
                    className="bg-red-400 text-white px-4 py-2 rounded-md"
                    onClick={() => handlePlayGame()}
                >
                    New Game
                </button>
            </div>

            <div className="flex flex-col space-y-4"> {/* Use flex-col and space-y-4 to stack the columns */}
                <div className="flex items-center">
                    <h2 className="font-semibold">Dealer</h2>
                </div>
                <div className="flex space-x-2">
                    {dealerHand.map((card: Card, index: number) => (
                        <div key={index} className="bg-white p-4 rounded-md border flex items-center">
                            <p className="text-xl">{card.value}</p>
                            <p className="text-2xl ml-1">{getSuitSymbol(card.suit)}</p>
                        </div>
                    ))}
                </div>
                <p>Sum: {dealerTotal}</p>
            </div>

            <div className="flex flex-col space-y-4 mt-10"> {/* Use flex-col and space-y-4 to stack the columns */}
                <div className="flex items-center">
                    <h2 className="font-semibold">Player</h2>
                </div>
                <div className="flex space-x-2">
                    {playerHand.map((card: Card, index: number) => (
                        <div key={index} className="bg-white p-4 rounded-md border flex items-center">
                            <p className="text-xl">{card.value}</p>
                            <p className="text-2xl ml-1">{getSuitSymbol(card.suit)}</p>
                        </div>
                    ))}
                </div>
                <p>Sum: {playerTotal}</p>
            </div>


            {/*Game buttons should appear only when the game is created*/}
            {isGameCreated ? (
                <div className="flex mt-10 space-x-4">
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded-md"
                        onClick={() => hit(playerHand, setPlayerHand)}
                    >
                        Hit
                    </button>

                    <button
                        className="bg-green-500 text-white px-4 py-2 rounded-md"
                        disabled={!isGameCreated}
                    >
                        Stand
                    </button>

                    <button
                        className="bg-gray-500 text-white px-4 py-2 rounded-md"
                        onClick={() => dealInitialHands()}
                        disabled={!isGameCreated}
                    >
                        Deal
                    </button>
                </div>

            ) : null}

        </div>
    );
};

export default BlackjackBoard;