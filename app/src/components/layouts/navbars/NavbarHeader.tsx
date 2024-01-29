import React from "react";
import { Button } from "../../ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuthentication } from "@/contexts/Authentication";
import { AppLogo } from "./AppLogo";

interface NavbarHeaderProps {
  showCloseButton: boolean;
  onClose: () => void;
}

export const NavbarHeader = ({
  showCloseButton,
  onClose,
}: NavbarHeaderProps) => {
  const { user } = useAuthentication();
  return (
    <div className="space-y-1 flex flex-col">
      <div className="flex justify-between items-center">
        <AppLogo />
        {!!showCloseButton && (
          <Button onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
      </div>
      {/* {!!user.id && (
        <div className="text-gray-200">
          For {user.role.slice(0, 1).toUpperCase().concat(user.role.slice(1))}s
        </div>
      )}
      {!user.id && <div className="text-gray-200">For Anonymous</div>} */}
    </div>
  );
};
