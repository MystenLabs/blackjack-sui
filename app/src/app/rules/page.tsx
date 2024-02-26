import React from "react";
import Link from "next/link";

const RulesPage = () => {
  return (
    <div className="bg-white flex flex-col p-[50px] max-w-[480px] mx-auto rounded-[24px] items-center space-y-[20px]">
      <div className="text-2xl font-bold">Game Rules</div>
      <div className="flex flex-col space-y-[10px] text-black text-opacity-80 text-sm">
        <div>
          Players generate randomness for the game by interacting with their
          mouse on the screen, after which they start the game.
        </div>
        <div>
          Upon initiating the game, the dealer is dealing two cards to the
          player and one to itself.
        </div>
        <div>
          The player has the options to &apos;Hit&apos; or &apos;Stand&apos;.
          Selecting &apos;Stand&apos; triggers the dealer to draw cards until
          the total reaches 17 or higher. After the dealer stops, typically at a
          sum of 17 or more, the smart contract steps in to compare the totals
          and declare the winner.
        </div>
        <div>
          On the other hand, choosing &apos;Hit&apos; prompts the dealer to draw
          an additional card for the player.
        </div>
        <div>
          Note that more complex Blackjack rules, such as splitting, are
          considered out of scope for this example Dapp, and are therefore not
          implemented.
        </div>
      </div>
      <Link
        href="/"
        className="text-sm rounded-full px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90"
      >
        New game
      </Link>
    </div>
  );
};

export default RulesPage;
