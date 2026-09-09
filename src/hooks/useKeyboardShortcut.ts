import { useEffect } from 'react';

type KeyCombo = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
};

export const useKeyboardShortcut = (
  combo: KeyCombo,
  callback: (e: KeyboardEvent) => void,
  enabled: boolean = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Don't trigger if the user is typing in a standard input/textarea without a modifier
      // UNLESS the modifier is required (like ⌘Enter)
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      const requiresModifier = combo.metaKey || combo.ctrlKey || combo.altKey;
      
      // If it's a raw key like 'Escape' and we are in an input, we might still want it
      // Let the caller decide if it should `preventDefault`

      const keyMatch = e.key.toLowerCase() === combo.key.toLowerCase();
      const metaMatch = combo.metaKey ? e.metaKey : true; // If true required, must be true. 
      const ctrlMatch = combo.ctrlKey ? e.ctrlKey : true;
      const altMatch = combo.altKey ? e.altKey : true;
      const shiftMatch = combo.shiftKey ? e.shiftKey : true;

      // Ensure that if a modifier is NOT required, it is NOT pressed (so 'e' doesn't trigger on 'Cmd+E')
      const metaExact = combo.metaKey === !!e.metaKey;
      const ctrlExact = combo.ctrlKey === !!e.ctrlKey;
      const altExact = combo.altKey === !!e.altKey;
      const shiftExact = combo.shiftKey === !!e.shiftKey;

      if (keyMatch && metaExact && ctrlExact && altExact && shiftExact) {
        callback(e);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [combo.key, combo.metaKey, combo.ctrlKey, combo.altKey, combo.shiftKey, callback, enabled]);
};
