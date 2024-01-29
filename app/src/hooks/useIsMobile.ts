import { useEffect, useState } from "react";

const MEDIUM_BREAKPOINT = 768; // Breakpoint for medium screens

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      console.log("screen resized...");
      const mobile = window.innerWidth < MEDIUM_BREAKPOINT;
      console.log({ isMobile: mobile });
      setIsMobile(mobile);
    };

    // Initial check
    handleResize();

    // Attach the event listener to window resize
    window.addEventListener("resize", handleResize);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return { isMobile };
};
