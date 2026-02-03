/**
 * Tests for src/hooks/useKeyboardShortcuts.ts
 * Tests keyboard shortcut handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, SHORTCUT_LABELS } from '../../../hooks/useKeyboardShortcuts';

// Helper to create keyboard events
function createKeyboardEvent(
  key: string,
  options: {
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
  } = {}
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    ctrlKey: options.ctrlKey ?? false,
    metaKey: options.metaKey ?? false,
    shiftKey: options.shiftKey ?? false,
    bubbles: true,
    cancelable: true,
  });
}

// Helper to dispatch keyboard event with target
function dispatchKeyWithTarget(
  key: string,
  target: HTMLElement,
  options: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean } = {}
): void {
  const event = createKeyboardEvent(key, options);
  Object.defineProperty(event, 'target', { value: target, writable: false });
  window.dispatchEvent(event);
}

describe('useKeyboardShortcuts', () => {
  let originalPlatform: string;

  beforeEach(() => {
    originalPlatform = navigator.platform;
    // Default to non-Mac platform
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'platform', {
      value: originalPlatform,
      writable: true,
      configurable: true,
    });
    vi.clearAllMocks();
  });

  describe('handler registration', () => {
    it('should add keydown event listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const handlers = { onSave: vi.fn() };

      renderHook(() => useKeyboardShortcuts(handlers));

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should remove keydown event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const handlers = { onSave: vi.fn() };

      const { unmount } = renderHook(() => useKeyboardShortcuts(handlers));
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('Ctrl+S (Save)', () => {
    it('should call onSave when Ctrl+S is pressed', () => {
      const onSave = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSave }));

      const event = createKeyboardEvent('s', { ctrlKey: true });
      window.dispatchEvent(event);

      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('should not call onSave without Ctrl key', () => {
      const onSave = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSave }));

      const event = createKeyboardEvent('s');
      window.dispatchEvent(event);

      expect(onSave).not.toHaveBeenCalled();
    });

    it('should handle uppercase S', () => {
      const onSave = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSave }));

      const event = createKeyboardEvent('S', { ctrlKey: true });
      window.dispatchEvent(event);

      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ctrl+P (Print)', () => {
    it('should call onPrint when Ctrl+P is pressed', () => {
      const onPrint = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onPrint }));

      const event = createKeyboardEvent('p', { ctrlKey: true });
      window.dispatchEvent(event);

      expect(onPrint).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ctrl+E (Export)', () => {
    it('should call onExport when Ctrl+E is pressed', () => {
      const onExport = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onExport }));

      const event = createKeyboardEvent('e', { ctrlKey: true });
      window.dispatchEvent(event);

      expect(onExport).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ctrl+N (New)', () => {
    it('should call onNew when Ctrl+N is pressed', () => {
      const onNew = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onNew }));

      const event = createKeyboardEvent('n', { ctrlKey: true });
      window.dispatchEvent(event);

      expect(onNew).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ctrl+Z (Undo)', () => {
    it('should call onUndo when Ctrl+Z is pressed', () => {
      const onUndo = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onUndo }));

      const event = createKeyboardEvent('z', { ctrlKey: true });
      window.dispatchEvent(event);

      expect(onUndo).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ctrl+Shift+Z (Redo)', () => {
    it('should call onRedo when Ctrl+Shift+Z is pressed', () => {
      const onRedo = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onRedo }));

      const event = createKeyboardEvent('z', { ctrlKey: true, shiftKey: true });
      window.dispatchEvent(event);

      expect(onRedo).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ctrl+Y (Redo alternative)', () => {
    it('should call onRedo when Ctrl+Y is pressed', () => {
      const onRedo = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onRedo }));

      const event = createKeyboardEvent('y', { ctrlKey: true });
      window.dispatchEvent(event);

      expect(onRedo).toHaveBeenCalledTimes(1);
    });
  });

  describe('Mac platform support', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
        configurable: true,
      });
    });

    it('should use Cmd key instead of Ctrl on Mac', () => {
      const onSave = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSave }));

      // Cmd+S (metaKey)
      const event = createKeyboardEvent('s', { metaKey: true });
      window.dispatchEvent(event);

      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('should not trigger with Ctrl on Mac', () => {
      const onSave = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSave }));

      // Ctrl+S on Mac should not trigger
      const event = createKeyboardEvent('s', { ctrlKey: true });
      window.dispatchEvent(event);

      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('input field exclusion', () => {
    it('should not trigger shortcuts when typing in input', () => {
      const onSave = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSave }));

      const input = document.createElement('input');
      dispatchKeyWithTarget('s', input, { ctrlKey: true });

      expect(onSave).not.toHaveBeenCalled();
    });

    it('should not trigger shortcuts when typing in textarea', () => {
      const onSave = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSave }));

      const textarea = document.createElement('textarea');
      dispatchKeyWithTarget('s', textarea, { ctrlKey: true });

      expect(onSave).not.toHaveBeenCalled();
    });

    it('should not trigger shortcuts when using select', () => {
      const onSave = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSave }));

      const select = document.createElement('select');
      dispatchKeyWithTarget('s', select, { ctrlKey: true });

      expect(onSave).not.toHaveBeenCalled();
    });

    it('should trigger shortcuts from non-input elements', () => {
      const onSave = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSave }));

      const div = document.createElement('div');
      dispatchKeyWithTarget('s', div, { ctrlKey: true });

      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('event prevention', () => {
    it('should prevent default behavior for matched shortcuts', () => {
      const onSave = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSave }));

      const event = createKeyboardEvent('s', { ctrlKey: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('missing handlers', () => {
    it('should not throw when handler is undefined', () => {
      renderHook(() => useKeyboardShortcuts({}));

      // Should not throw
      expect(() => {
        const event = createKeyboardEvent('s', { ctrlKey: true });
        window.dispatchEvent(event);
      }).not.toThrow();
    });

    it('should only call defined handlers', () => {
      const onSave = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSave }));

      // Ctrl+P should not throw even without onPrint
      const event = createKeyboardEvent('p', { ctrlKey: true });
      window.dispatchEvent(event);

      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('handler updates', () => {
    it('should use updated handlers', () => {
      const onSave1 = vi.fn();
      const onSave2 = vi.fn();

      const { rerender } = renderHook(({ handlers }) => useKeyboardShortcuts(handlers), {
        initialProps: { handlers: { onSave: onSave1 } },
      });

      // First call
      const event1 = createKeyboardEvent('s', { ctrlKey: true });
      window.dispatchEvent(event1);
      expect(onSave1).toHaveBeenCalledTimes(1);

      // Update handler
      rerender({ handlers: { onSave: onSave2 } });

      // Second call with new handler
      const event2 = createKeyboardEvent('s', { ctrlKey: true });
      window.dispatchEvent(event2);
      expect(onSave2).toHaveBeenCalledTimes(1);
      expect(onSave1).toHaveBeenCalledTimes(1); // Still just the first call
    });
  });

  describe('SHORTCUT_LABELS constant', () => {
    it('should export correct shortcut labels', () => {
      expect(SHORTCUT_LABELS.save).toBe('Ctrl+S');
      expect(SHORTCUT_LABELS.print).toBe('Ctrl+P');
      expect(SHORTCUT_LABELS.export).toBe('Ctrl+E');
      expect(SHORTCUT_LABELS.new).toBe('Ctrl+N');
      expect(SHORTCUT_LABELS.undo).toBe('Ctrl+Z');
      expect(SHORTCUT_LABELS.redo).toBe('Ctrl+Y');
    });
  });

  describe('unrecognized keys', () => {
    it('should not trigger handlers for unrecognized keys', () => {
      const handlers = {
        onSave: vi.fn(),
        onPrint: vi.fn(),
        onExport: vi.fn(),
        onNew: vi.fn(),
        onUndo: vi.fn(),
        onRedo: vi.fn(),
      };
      renderHook(() => useKeyboardShortcuts(handlers));

      const event = createKeyboardEvent('x', { ctrlKey: true });
      window.dispatchEvent(event);

      Object.values(handlers).forEach((handler) => {
        expect(handler).not.toHaveBeenCalled();
      });
    });
  });
});
