import React from "react";
import { UserProfileMenu } from "@/components/general/UserProfileMenu";
import { UserAvatar } from "@/components/general/UserAvatar";
import { useAuthentication } from "@/contexts/Authentication";
import { NavbarLinks } from "./NavbarLinks";
import { USER_ROLES } from "@/constants/USER_ROLES";

export const BottomNavbar = () => {
  const { user } = useAuthentication();
  return (
    <div
      className={`sticky bottom-0 w-full bg-primary flex space-x-2 justify-center items-center`}
    >
      <NavbarLinks position="bottom" />
      {user?.role !== USER_ROLES.ROLE_4 &&
        process.env.NEXT_PUBLIC_USE_TOP_NAVBAR_IN_LARGE_SCREEN === "1" && (
          <div className="w-[80px]">
            <UserProfileMenu
              trigger={<UserAvatar user={user} showNameEmail={false} />}
            />
          </div>
        )}
    </div>
  );
};
