"use client";

import { useAuthentication } from "@/contexts/Authentication";
import { isNavigationLinkActive } from "@/helpers/isNavigationLinkActive";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { cloneElement, useMemo } from "react";
import { navigationsByUserRole } from "./navigationsByUserRole";

interface NavbarLinksProps {
  position: "top" | "bottom" | "side";
}

export const NavbarLinks = ({ position = "top" }: NavbarLinksProps) => {
  const pathname = usePathname();
  const { user } = useAuthentication();
  const navigations = useMemo(
    () => navigationsByUserRole[user.role] ?? [],
    [user.role]
  );

  return (
    <div
      className={`flex ${
        position === "top" || position === "bottom"
          ? "h-full justify-start space-x-2 md:space-x-4 items-center overflow-x-auto"
          : "flex-col space-y-3"
      }`}
    >
      {navigations.map(({ title, href, icon }) => {
        const isActive = isNavigationLinkActive({
          href,
          pathname,
          user,
        });
        return (
          <Link
            key={href}
            className={`flex ${
              position === "bottom"
                ? "flex-col items-center justify-center space-y-2 text-center text-sm"
                : "items-center space-x-4 text-lg"
            }  font-weight-500 text-contrast p-2 rounded-lg ${
              isActive ? "bg-secondary text-contrast" : "text-contrast-disabled"
            }`}
            href={href}
          >
            {!!icon && position !== "top" &&
              cloneElement(icon, {
                className: "w-5 h-5",
              })}
            <div className="whitespace-nowrap">{title}</div>
          </Link>
        );
      })}
    </div>
  );
};
