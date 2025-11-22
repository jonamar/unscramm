import { useEffect, useState } from 'react';

/**
 * Hook to detect if the user prefers reduced motion.
 * Listens to the prefers-reduced-motion media query and updates accordingly.
 *
 * @returns true if user prefers reduced motion, false otherwise
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return reduced;
}
