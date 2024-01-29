import { UserProps } from "@/types/Authentication";

interface IsNavigationLinkActiveProps {
  pathname: string;
  href: string;
  user: UserProps;
}

export const isNavigationLinkActive = ({
  pathname,
  href,
  user,
}: IsNavigationLinkActiveProps) => {
  const pathParts = pathname.split("/").filter((part) => !!part);
  const pathSuffix = pathParts[pathParts.length - 1];
  const isAtHome =
    !pathParts.length ||
    (pathParts.length === 1 && pathSuffix === `${user.role}`);
  const isHomeLink = href === "/" || href === `/${user.role}`;
  const isActive =
    (isAtHome && isHomeLink) || (!isHomeLink && pathname.includes(href));
  return isActive;
};
