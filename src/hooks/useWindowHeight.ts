import { useState, useEffect, useLayoutEffect, useCallback } from 'react';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function useWindowHeight(appBarId: string = 'AppBar'): number {
  const [availableHeight, setAvailableHeight] = useState(0);

  const calculateAvailableHeight = useCallback(() => {
    if (typeof window === 'undefined') return 0;
    const appBar = document.getElementById(appBarId);
    const appBarHeight = appBar ? appBar.offsetHeight : 0;
    return window.innerHeight - appBarHeight;
  }, [appBarId]);

  useIsomorphicLayoutEffect(() => {
    function handleResize() {
      setAvailableHeight(calculateAvailableHeight());
    }

    setAvailableHeight(calculateAvailableHeight());

    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, [calculateAvailableHeight]);

  return availableHeight;
}
