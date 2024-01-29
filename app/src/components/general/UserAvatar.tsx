import { UserProps } from "@/types/Authentication";
import Image from "next/image";
import React from "react";

interface UserAvatarProps {
  user: UserProps;
  showNameEmail?: boolean;
}
export const UserAvatar = ({ user, showNameEmail = true }: UserAvatarProps) => {
  if (!user?.id) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <Image
        src={"/user.svg"}
        className="rounded-full"
        width={50}
        height={50}
        alt="profile"
      />
      {!!showNameEmail && (
        <div className="flex flex-col">
          <div className="text-contrast">
            {user.firstName} {user.lastName}
          </div>
          <div className="pl-[3px] text-sm text-contrast-disabled">
            {user.email}
          </div>
        </div>
      )}
    </div>
  );
};
