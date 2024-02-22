import Image from "next/image";
import React from "react";

interface CardsHandProps {
  cards: number[];
  points: number;
  won?: boolean;
  lost?: boolean;
}
export const CardsHand = ({ cards, points, won, lost }: CardsHandProps) => {
  const isBlackjack = cards.length === 2 && points === 21;

  if (cards.length === 0) {
    return (
      <Image src="/general/empty-hand.svg" width={120} height={166} alt="empty hand" />
    );
  }
  return (
    <div className={`relative ${(won || points === 21) && "border-[8px] rounded-xl border-[#58BB80]"}`}>
      <div className="flex m-[-2px]">
        {cards.map((card, index) => {
          const kind =
            card < 13
              ? "clubs"
              : card < 26
              ? "diamonds"
              : card < 39
              ? "hearts"
              : "spades";
          const val = card % 13;
          const name =
            val === 0
              ? "A"
              : val === 10
              ? "J"
              : val === 11
              ? "Q"
              : val === 12
              ? "K"
              : val + 1;

          return (
            <Image
              key={index}
              src={`/cards/${kind}/${kind}-${name}.svg`}
              width={120}
              height={166}
              alt={`card ${card}`}
              className={!!index ? `ml-[-90px]` : ""}
            />
          );
        })}
      </div>
      <div
        className={`absolute top-[-15px] right-[-15px] bg-black rounded-full ${
          points < 21 && won ? "text-[#FFCE57]" : "text-white"
        } w-[40px] py-[1px] text-[18px]`}
      >
        {points}
      </div>
      {isBlackjack && (
        <div className="absolute bottom-[7px] left-[7px]">
          <Image
            src="/result/blackjack-chip.svg"
            width={131}
            height={29}
            alt="blackjack"
          />
        </div>
      )}
      {points > 21 && (
        <div className="absolute bottom-[7px] left-[7px]">
          <Image
            src="/result/bust-chip.svg"
            width={72}
            height={21}
            alt="busted"
          />
        </div>
      )}
      {!isBlackjack && won && (
        <div className="absolute bottom-[7px] left-[7px]">
          <Image src="/result/win-chip.svg" width={96} height={28} alt="win" />
        </div>
      )}
      {points < 21 && lost && (
        <div className="absolute bottom-[7px] left-[7px]">
          <Image
            src="/result/lose-chip.svg"
            width={72}
            height={21}
            alt="lose"
          />
        </div>
      )}
    </div>
  );
};
