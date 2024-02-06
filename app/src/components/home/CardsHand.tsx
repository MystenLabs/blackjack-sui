import Image from "next/image";
import React from "react";

interface CardsHandProps {
  cards: number[];
  points: number;
}
export const CardsHand = ({ cards, points }: CardsHandProps) => {
  if (cards.length === 0) {
    return (
      <Image src="/empty-hand.svg" width={120} height={166} alt="empty hand" />
    );
  }
  return (
    <div className="relative">
      <div className="flex">
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

          const src = `/cards/${kind}/${kind}-${name}.svg`;
          console.log("src", src);
          return (
            <Image
              key={index}
              src={src}
              width={120}
              height={166}
              alt={`card ${card}`}
              className={!!index ? `ml-[-90px]` : ""}
            />
          );
        })}
      </div>
      <div className="absolute top-[-15px] right-[-15px] bg-black rounded-full text-white w-[40px] py-[1px] text-[18px]">
        <div>{points}</div>
      </div>
    </div>
  );
};
