import React from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export const InfoIcon = () => {
  return (
    <>
      <div className="absolute bottom-0 left-0 p-5">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              className="w-[40px] h-[40px] relative bg-white hover:bg-gray-100 h-rounded-[10px] border-[1px] border-[#CCCCCC] opacity-80"
            >
              <Image src="/general/info.svg"
                     alt="Info"
                     fill={true}
              />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] h-1/2">
            <DialogHeader>
              <DialogTitle>Game Rules</DialogTitle>
            </DialogHeader>
            <ScrollArea>
              <div className="space-y-[10px] text-black text-opacity-80 text-sm">
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
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};
