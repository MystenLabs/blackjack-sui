import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { useEnokiFlow } from "@mysten/enoki/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export const SignInBanner = () => {
  const enokiFlow = useEnokiFlow();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = () => {
    setIsLoading(true);
    const protocol = window.location.protocol;
    const host = window.location.host;
    const redirectUrl = `${protocol}//${host}/auth`;
    console.log({
      redirectUrl,
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    });
    enokiFlow
      .createAuthorizationURL({
        provider: "google",
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        redirectUrl,
        network: "testnet",
        extraParams: {
          scope: ["openid", "email", "profile"],
        },
      })
      .then((url) => {
        setIsLoading(false);
        router.push(url);
      })
      .catch((error) => {
        setIsLoading(false);
        console.error(error);
        toast.error("Failed to redirect to Google Sign In. Please try again.");
      });
  };

  return (
    <div className="flex flex-col items-center space-y-[20px]">
      <div className="bg-white flex flex-col p-[60px] max-w-[480px] mx-auto rounded-[24px] items-center space-y-[60px]">
        <Image
          src="/general/mysten-logo-red.svg"
          alt="Mysten Labs"
          width={160}
          height={20}
        />
        <div className="flex flex-col space-y-[30px] items-center">
          <div className="flex flex-col space-y-[20px] items-center">
            <div className="font-[700] text-[20px] text-center">
              Sign In and Play <br /> Mysten Blackjack
            </div>
            <div className="text-center text-opacity-90 text-[14px] text-[#4F4F4F]">
              Welcome to Mysten Blackjack – where blockchain meets Blackjack!
              Experience the fusion of cutting-edge technology and classic card
              gaming. Login now for a seamless, fair, and thrilling adventure on
              the Sui blockchain. Good luck at the tables!
            </div>
          </div>
          <Button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-[64px] h-[64px] bg-[inherit] rounded-[10px] border-[1px] border-[#CCCCCC] hover:bg-gray-100"
          >
            <Image
              src="/general/google.svg"
              alt="Google"
              width={32}
              height={32}
            />
          </Button>
        </div>
      </div>
      <div className="flex flex-col items-center text-white text-[12px]">
        <div className="text-center">Learn more about Mysten Labs at</div>
        <Link
          href="https://mystenlabs.com"
          target="_blank"
          rel="noopenner noreferrer"
          className="underline"
        >
          mystenlabs.com
        </Link>
      </div>
    </div>
  );
};
