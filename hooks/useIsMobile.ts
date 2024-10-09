import { useEffect, useState } from "react";

const MEDIUM_BREAKPOINT = 768; // Breakpoint for medium screens

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MEDIUM_BREAKPOINT;
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
