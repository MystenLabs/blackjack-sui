import React from "react";
import {
  BackpackIcon,
  CheckCircledIcon,
  CodeIcon,
  CountdownTimerIcon,
  HomeIcon,
  LightningBoltIcon,
  PaperPlaneIcon,
  PersonIcon,
} from "@radix-ui/react-icons";
import { NavigationLink } from "@/types/NavigationLink";
import { USER_ROLES } from "@/constants/USER_ROLES";

const aboutNavigation: NavigationLink = {
  title: "About",
  href: "/about",
  icon: <CodeIcon />,
};

const ownedObjectsNavigation: NavigationLink = {
  title: "My Objects",
  href: "/objects",
  icon: <BackpackIcon />,
};

const apiNavigations: NavigationLink[] = [
  {
    title: "API Health",
    href: "/api/health",
    icon: <CheckCircledIcon />,
  },
  {
    title: "API Visits",
    href: "/api/visits",
    icon: <CountdownTimerIcon />,
  },
];

// const accountNavigation: NavigationLink = {
//   title: "Account",
//   href: "/account",
//   icon: <PersonIcon />,
// };

const transferNavigation: NavigationLink = {
  title: "Transfer SUI",
  href: "/transfer",
  icon: <PaperPlaneIcon />,
};

const pwaShowcaseNavigation: NavigationLink = {
  title: "PWA Showcase",
  href: "/pwa",
  icon: <LightningBoltIcon />,
};

const authenticatedNavigations: NavigationLink[] = [
  ownedObjectsNavigation,
  transferNavigation,
  // accountNavigation,
];

const globalNavigations: NavigationLink[] = [
  aboutNavigation,
  ...apiNavigations,
  pwaShowcaseNavigation,
];

export const navigationsByUserRole = {
  anonymous: [
    {
      title: "Home",
      href: "/",
      icon: <HomeIcon />,
    },
    ...(process.env.NEXT_PUBLIC_USE_AUTHENTICATION !== "1"
      ? [ownedObjectsNavigation, transferNavigation]
      : []),
    ...globalNavigations,
  ],
  member: [
    {
      title: "Home",
      href: `/${USER_ROLES.ROLE_3}`,
      icon: <HomeIcon />,
    },
    // {
    //   title: `Member Test`,
    //   href: `/${USER_ROLES.ROLE_3}/test`,
    //   icon: <LetterCaseCapitalizeIcon />,
    // },
    ...authenticatedNavigations,
    ...globalNavigations,
  ],
  moderator: [
    {
      title: "Home",
      href: `/${USER_ROLES.ROLE_2}`,
      icon: <HomeIcon />,
    },
    // {
    //   title: `Moderator Test`,
    //   href: `/${USER_ROLES.ROLE_2}/test`,
    //   icon: <LetterCaseCapitalizeIcon />,
    // },
    ...authenticatedNavigations,
    ...globalNavigations,
  ],
  admin: [
    {
      title: "Home",
      href: `/${USER_ROLES.ROLE_1}`,
      icon: <HomeIcon />,
    },
    // {
    //   title: `Admin Test`,
    //   href: `/${USER_ROLES.ROLE_1}/test`,
    //   icon: <LetterCaseCapitalizeIcon />,
    // },
    ...authenticatedNavigations,
    ...globalNavigations,
  ],
};
