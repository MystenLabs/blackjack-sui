import React, { useState } from "react";
import Link from "next/link";
import { useZkLogin } from "@mysten/enoki/react";
import { UserProfileMenu } from "../general/UserProfileMenu";
import { Balance } from "../general/Balance";
import Popover from "@/components/ui/popover";
import { ChevronDown } from "lucide-react"

export const TopNavbar = () => {
  const { address } = useZkLogin();
  const [openPopover, setOpenPopover] = useState(false);

  return (
    <>
      <div className="sticky top-0 w-full flex justify-evenly items-center bg-white">
        <span className="text-black">[Mysten Blackjack] is provided for testnet purposes only and do not involve real money or the opportunity to win real money.</span>
      </div>
      <div className="grid grid-cols-6 mx-5 my-1">
        <div className="col-span-3 flex space-x-3 items-center">
          <Link href="/new" className="w-[min-content] md:w-[300px] text-2xl font-bold text-white">
            Mysten Blackjack
          </Link>
        </div>
        <div className="col-span-3 flex justify-end">
          {!!address && (
            <div className="flex space-x-2 items-center">
              <Popover content={
                <div className="flex flex-col p-[20px] max-w-[480px] rounded-[24px] items-center space-y-[20px]">
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
                </div>
              } openPopover={openPopover} setOpenPopover={setOpenPopover}>
                <button onClick={() => setOpenPopover(!openPopover)}>
                  <p className="text-yellow-200 font-bold text-lg">Game Rules</p>
                  <ChevronDown
                    className={`h-4 w-4 text-yellow-200 transition-all ${openPopover ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </Popover>
              <Balance/>
              <UserProfileMenu/>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
