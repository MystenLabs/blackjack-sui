"use client";

import { NavbarHeader } from "./NavbarHeader";
import { NavbarLinks } from "./NavbarLinks";
import { UserAvatar } from "../../general/UserAvatar";
import { useAuthentication } from "@/contexts/Authentication";
import { USER_ROLES } from "@/constants/USER_ROLES";
import { UserProfileMenu } from "@/components/general/UserProfileMenu";

interface NavbarProps {
  isOpen: boolean;
  onClose: () => void;
  width: number;
}

export const SideNavbar = ({ isOpen, onClose, width }: NavbarProps) => {
  const { user } = useAuthentication();
  return (
    <div
      className={`sticky top-0 ${
        isOpen ? "block" : "hidden"
      } w-[${width}px] left-0 h-screen bg-primary`}
    >
      <div className="flex flex-col justify-between h-full p-5">
        <div className="space-y-20">
          <NavbarHeader showCloseButton={isOpen} onClose={onClose} />
          <NavbarLinks position="side" />
        </div>
        {user?.role !== USER_ROLES.ROLE_4 &&
          process.env.NEXT_PUBLIC_USE_TOP_NAVBAR_IN_LARGE_SCREEN === "1" && (
            <div className="flex justify-between items-center">
              <UserAvatar user={user} />
              <UserProfileMenu />
            </div>
          )}
      </div>
    </div>
  );
};
