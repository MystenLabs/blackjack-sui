import React, { useState } from 'react';

const BlackjackBoard = () => {
    const [playerHand, setPlayerHand] = useState([]);
    const [dealerHand, setDealerHand] = useState([]);
    const [deck, setDeck] = useState([]);

    const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
    const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

    const generateDeck = () => {
        const newDeck = [];
        for (const suit of suits) {
            for (const value of values) {
                newDeck.push({ suit, value });
            }
        }
        return newDeck;
    };

    const dealInitialHands = () => {
        const newDeck = generateDeck();
        const shuffledDeck = newDeck.sort(() => Math.random() - 0.5);
        const playerInitialHand = [shuffledDeck.pop(), shuffledDeck.pop()];
        const dealerInitialHand = [shuffledDeck.pop(), shuffledDeck.pop()];

        setDeck(shuffledDeck);
        setPlayerHand(playerInitialHand);
        setDealerHand(dealerInitialHand);
    };

    const hit = (hand, setHand) => {
        if (deck.length === 0) return;

        const newHand = [...hand, deck.pop()];
        setDeck([...deck]);
        setHand(newHand);
    };

    const calculateHandValue = (hand) => {
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

    const getValue = (value) => {
        if (["K", "Q", "J"].includes(value)) {
            return 10;
        } else if (value === "A") {
            return 1;
        } else {
            return parseInt(value, 10);
        }
    };

    const getSuitSymbol = (suit) => {
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

    const playerTotal = calculateHandValue(playerHand);
    const dealerTotal = calculateHandValue(dealerHand);

    return (
        <div className="flex flex-col items-center mt-10">
            <h1 className="text-2xl font-bold mb-2">Blackjack</h1>

            <div className="flex justify-center space-x-4">
                <div className="flex flex-col items-center">
                    <h2 className="font-semibold">Dealer</h2>
                    <div className="flex space-x-2">
                        {dealerHand.map((card, index) => (
                            <div key={index} className="bg-white p-3 rounded-md border flex items-center">
                                <p className="text-xl">{card.value}</p>
                                <p className="text-2xl ml-1">{getSuitSymbol(card.suit)}</p>
                            </div>
                        ))}
                    </div>
                    <p className="mt-1">{dealerTotal}</p>
                </div>

                <div className="flex flex-col items-center">
                    <h2 className="font-semibold">Player</h2>
                    <div className="flex space-x-2">
                        {playerHand.map((card, index) => (
                            <div key={index} className="bg-white p-3 rounded-md border flex items-center">
                                <p className="text-xl">{card.value}</p>
                                <p className="text-2xl ml-1">{getSuitSymbol(card.suit)}</p>
                            </div>
                        ))}
                    </div>
                    <p className="mt-1">{playerTotal}</p>
                </div>
            </div>

            <div className="flex mt-4 space-x-4">
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded-md"
                    onClick={() => hit(playerHand, setPlayerHand)}
                >
                    Hit
                </button>

                <button
                    className="bg-green-500 text-white px-4 py-2 rounded-md"
                >
                    Stand
                </button>

                <button
                    className="bg-gray-500 text-white px-4 py-2 rounded-md"
                    onClick={dealInitialHands}
                >
                    Deal
                </button>
            </div>
        </div>
    );
};

export default BlackjackBoard;
