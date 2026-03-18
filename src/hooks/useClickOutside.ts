import { useEffect, useRef } from 'react';

export function useClickOutside<T extends HTMLElement>(
  active: boolean,
  callback: () => void,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active) return;

    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [active, callback]);

  return ref;
}
