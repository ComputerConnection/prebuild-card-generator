import { useEffect, useCallback } from 'react';

interface ShortcutHandlers {
  onSave?: () => void;
  onPrint?: () => void;
  onExport?: () => void;
  onNew?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Check if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            handlers.onSave?.();
            break;
          case 'p':
            e.preventDefault();
            handlers.onPrint?.();
            break;
          case 'e':
            e.preventDefault();
            handlers.onExport?.();
            break;
          case 'n':
            e.preventDefault();
            handlers.onNew?.();
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              handlers.onRedo?.();
            } else {
              handlers.onUndo?.();
            }
            break;
          case 'y':
            e.preventDefault();
            handlers.onRedo?.();
            break;
        }
      }
    },
    [handlers]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export const SHORTCUT_LABELS = {
  save: 'Ctrl+S',
  print: 'Ctrl+P',
  export: 'Ctrl+E',
  new: 'Ctrl+N',
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Y',
};
