import React from "react";

interface NavigationLinkProps {
  title: string;
  href: string;
}

export const useGetNavigations = () => {
  const navigations = React.useMemo<NavigationLinkProps[]>(() => {
    return [
      {
        title: "Home",
        href: "/",
      },
      {
        title: "Account",
        href: "/account",
      },
      {
        title: "About",
        href: "/about",
      },
      {
        title: "API Health Check",
        href: "/api/health",
      },
      {
        title: "API Visits",
        href: "/api/visits",
      },
    ];
  }, []);

  return { navigations };
};
