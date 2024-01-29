import { USER_ROLES } from "@/constants/USER_ROLES";
import { useAuthentication } from "@/contexts/Authentication";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface AppLogoProps {
  className?: string;
}
export const AppLogo = ({ className = "" }: AppLogoProps) => {
  const { user } = useAuthentication();
  return (
    <Link
      href={`/${user.role === USER_ROLES.ROLE_4 ? "/" : user.role}`}
      className={`min-w-[175px] flex space-x-3 text-2xl font-bold text-contrast items-center ${className}`}
    >
      <Image
        src={
          className.includes("text-black")
            ? "/MystenLabs_Vertical_Logo_Black.svg"
            : "/MystenLabs_Vertical_Logo_White.svg"
        }
        alt="Mysten Labs"
        width={50}
        height={50}
      />
      <div>PoC Template</div>
    </Link>
  );
};
