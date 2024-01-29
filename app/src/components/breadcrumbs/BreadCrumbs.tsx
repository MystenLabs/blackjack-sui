import { isUserRole } from "@/helpers/isUserRole";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

interface BreadCrumbsPart {
  label: string;
  href: string;
}

export const BreadCrumbs = () => {
  const [parts, setParts] = useState<BreadCrumbsPart[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    const pathnameParts = pathname.split("/").filter((part) => !!part);
    if (pathnameParts.length === 0) {
      setParts([{ label: "Home", href: "/" }]);
      return;
    }
    setParts(
      pathnameParts.map((part, index) => {
        const label = isUserRole(part)
          ? "Home"
          : part.slice(0, 1).toUpperCase() + part.slice(1);
        const href = "/" + pathnameParts.slice(0, index + 1).join("/");
        return { label, href };
      })
    );
  }, [pathname]);

  return (
    <div className="flex space-x-1 items-center">
      {parts.map(({ label, href }, index) => {
        const isLast = index === parts.length - 1;
        return (
          <div className="flex space-x-1 items-center" key={index}>
            <Link
              href={href}
              className={`text-lg ${
                isLast ? "text-gray-500" : "text-secondary"
              }`}
            >
              {label}
            </Link>
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </div>
        );
      })}
    </div>
  );
};
