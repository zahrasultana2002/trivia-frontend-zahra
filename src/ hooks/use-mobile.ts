import { useEffect, useState } from "react";

export function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width:${breakpoint}px)`);
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile("matches" in e ? e.matches : (e as MediaQueryList).matches);

    handler(mql);
    if ("mql.addEventListener" in mql) {
      mql.addEventListener("change", handler as any);
      return () => mql.removeEventListener("change", handler as any);
    } else {
      // Safari
      mql.addListener(handler as any);
      return () => mql.removeListener(handler as any);
    }
  }, [breakpoint]);

  return isMobile;
}
