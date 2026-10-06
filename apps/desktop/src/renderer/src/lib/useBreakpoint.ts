import { useState, useEffect } from 'react';

/**
 * Breakpoints ajustados al contexto de la app Electron:
 * - compact:   960–1023px  → ventana en su tamaño mínimo
 * - default:  1024–1279px  → ventana normal
 * - wide:     1280–1535px  → ventana grande
 * - ultrawide: 1536px+     → pantalla completa / 4K
 */
export type Breakpoint = 'compact' | 'default' | 'wide' | 'ultrawide';

function getBreakpoint(): Breakpoint {
  const w = window.innerWidth;
  if (w < 1024) return 'compact';
  if (w < 1280) return 'default';
  if (w < 1536) return 'wide';
  return 'ultrawide';
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(getBreakpoint);

  useEffect(() => {
    const handler = () => setBp(getBreakpoint());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return bp;
}

/** Helpers de conveniencia */
export const isCompact = (bp: Breakpoint): boolean => bp === 'compact';
export const isAtLeast = (bp: Breakpoint, min: Breakpoint): boolean => {
  const order: Breakpoint[] = ['compact', 'default', 'wide', 'ultrawide'];
  return order.indexOf(bp) >= order.indexOf(min);
};
