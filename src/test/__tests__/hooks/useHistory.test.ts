/**
 * Tests for src/hooks/useHistory.ts
 * Tests the undo/redo history hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistory } from '../../../hooks/useHistory';

describe('useHistory', () => {
  describe('initial state', () => {
    it('should initialize with provided initial state', () => {
      const { result } = renderHook(() => useHistory({ value: 'initial' }));

      expect(result.current.state).toEqual({ value: 'initial' });
    });

    it('should start with canUndo false', () => {
      const { result } = renderHook(() => useHistory('initial'));

      expect(result.current.canUndo).toBe(false);
    });

    it('should start with canRedo false', () => {
      const { result } = renderHook(() => useHistory('initial'));

      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('setState', () => {
    it('should update state', () => {
      const { result } = renderHook(() => useHistory('first'));

      act(() => {
        result.current.setState('second');
      });

      expect(result.current.state).toBe('second');
    });

    it('should enable undo after state change', () => {
      const { result } = renderHook(() => useHistory('first'));

      act(() => {
        result.current.setState('second');
      });

      expect(result.current.canUndo).toBe(true);
    });

    it('should accept callback function for setState', () => {
      const { result } = renderHook(() => useHistory(10));

      act(() => {
        result.current.setState((prev) => prev + 5);
      });

      expect(result.current.state).toBe(15);
    });

    it('should not add to history if state unchanged', () => {
      const { result } = renderHook(() => useHistory({ count: 1 }));

      act(() => {
        result.current.setState({ count: 1 });
      });

      expect(result.current.canUndo).toBe(false);
    });

    it('should clear future on new state change', () => {
      const { result } = renderHook(() => useHistory('first'));

      // Create history
      act(() => {
        result.current.setState('second');
      });

      // Undo to create future
      act(() => {
        result.current.undo();
      });
      expect(result.current.canRedo).toBe(true);

      // Make new change - should clear future
      act(() => {
        result.current.setState('third');
      });

      expect(result.current.canRedo).toBe(false);
      expect(result.current.state).toBe('third');
    });
  });

  describe('undo', () => {
    it('should restore previous state', () => {
      const { result } = renderHook(() => useHistory('first'));

      act(() => {
        result.current.setState('second');
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toBe('first');
    });

    it('should enable redo after undo', () => {
      const { result } = renderHook(() => useHistory('first'));

      act(() => {
        result.current.setState('second');
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);
    });

    it('should disable canUndo when no more history', () => {
      const { result } = renderHook(() => useHistory('first'));

      act(() => {
        result.current.setState('second');
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(false);
    });

    it('should do nothing when no history to undo', () => {
      const { result } = renderHook(() => useHistory('only'));

      const stateBefore = result.current.state;

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toBe(stateBefore);
    });

    it('should handle multiple undos', () => {
      const { result } = renderHook(() => useHistory('first'));

      act(() => {
        result.current.setState('second');
      });
      act(() => {
        result.current.setState('third');
      });

      act(() => {
        result.current.undo();
      });
      expect(result.current.state).toBe('second');

      act(() => {
        result.current.undo();
      });
      expect(result.current.state).toBe('first');
    });
  });

  describe('redo', () => {
    it('should restore next state after undo', () => {
      const { result } = renderHook(() => useHistory('first'));

      act(() => {
        result.current.setState('second');
      });
      act(() => {
        result.current.undo();
      });

      act(() => {
        result.current.redo();
      });

      expect(result.current.state).toBe('second');
    });

    it('should disable canRedo after redo', () => {
      const { result } = renderHook(() => useHistory('first'));

      act(() => {
        result.current.setState('second');
      });
      act(() => {
        result.current.undo();
      });
      act(() => {
        result.current.redo();
      });

      expect(result.current.canRedo).toBe(false);
    });

    it('should do nothing when no future to redo', () => {
      const { result } = renderHook(() => useHistory('only'));

      const stateBefore = result.current.state;

      act(() => {
        result.current.redo();
      });

      expect(result.current.state).toBe(stateBefore);
    });

    it('should handle multiple redos', () => {
      const { result } = renderHook(() => useHistory('first'));

      act(() => {
        result.current.setState('second');
      });
      act(() => {
        result.current.setState('third');
      });
      act(() => {
        result.current.undo();
      });
      act(() => {
        result.current.undo();
      });

      act(() => {
        result.current.redo();
      });
      expect(result.current.state).toBe('second');

      act(() => {
        result.current.redo();
      });
      expect(result.current.state).toBe('third');
    });
  });

  describe('reset', () => {
    it('should reset to new state', () => {
      const { result } = renderHook(() => useHistory('first'));

      act(() => {
        result.current.setState('second');
      });
      act(() => {
        result.current.setState('third');
      });

      act(() => {
        result.current.reset('new');
      });

      expect(result.current.state).toBe('new');
    });

    it('should clear history after reset', () => {
      const { result } = renderHook(() => useHistory('first'));

      act(() => {
        result.current.setState('second');
      });

      act(() => {
        result.current.reset('new');
      });

      expect(result.current.canUndo).toBe(false);
    });

    it('should clear future after reset', () => {
      const { result } = renderHook(() => useHistory('first'));

      act(() => {
        result.current.setState('second');
      });
      act(() => {
        result.current.undo();
      });

      act(() => {
        result.current.reset('new');
      });

      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('max history limit', () => {
    it('should limit history to 50 entries', () => {
      const { result } = renderHook(() => useHistory(0));

      // Add 55 changes
      for (let i = 1; i <= 55; i++) {
        act(() => {
          result.current.setState(i);
        });
      }

      // Undo 50 times (max history)
      let undoCount = 0;
      while (result.current.canUndo) {
        act(() => {
          result.current.undo();
        });
        undoCount++;
      }

      // Should have exactly 50 undos available
      expect(undoCount).toBe(50);
    });

    it('should drop oldest entries when limit exceeded', () => {
      const { result } = renderHook(() => useHistory('start'));

      // Add 55 changes (0-54)
      for (let i = 0; i < 55; i++) {
        act(() => {
          result.current.setState(`state-${i}`);
        });
      }

      // Undo all the way back
      while (result.current.canUndo) {
        act(() => {
          result.current.undo();
        });
      }

      // Should stop at state-4 (dropped 0-3 and 'start')
      // Actually it should be state-4 because we keep 50 entries
      // With 55 changes + initial, oldest 5 are dropped
      expect(result.current.state).toBe('state-4');
    });
  });

  describe('complex state objects', () => {
    it('should handle object state changes', () => {
      const { result } = renderHook(() => useHistory({ name: 'PC', price: 1000 }));

      act(() => {
        result.current.setState({ name: 'Gaming PC', price: 1500 });
      });

      expect(result.current.state).toEqual({ name: 'Gaming PC', price: 1500 });
    });

    it('should detect object state changes correctly', () => {
      const { result } = renderHook(() => useHistory({ items: [1, 2, 3] }));

      act(() => {
        result.current.setState({ items: [1, 2, 3, 4] });
      });

      expect(result.current.canUndo).toBe(true);

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toEqual({ items: [1, 2, 3] });
    });

    it('should not add duplicate objects to history', () => {
      const { result } = renderHook(() => useHistory({ value: 'test' }));

      act(() => {
        result.current.setState({ value: 'test' }); // Same content
      });

      expect(result.current.canUndo).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle null state', () => {
      const { result } = renderHook(() => useHistory<string | null>(null));

      act(() => {
        result.current.setState('value');
      });

      expect(result.current.state).toBe('value');

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toBeNull();
    });

    it('should handle array state', () => {
      const { result } = renderHook(() => useHistory<number[]>([]));

      act(() => {
        result.current.setState([1, 2, 3]);
      });

      expect(result.current.state).toEqual([1, 2, 3]);

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toEqual([]);
    });

    it('should handle rapid state changes', () => {
      const { result } = renderHook(() => useHistory(0));

      act(() => {
        result.current.setState(1);
        result.current.setState(2);
        result.current.setState(3);
      });

      expect(result.current.state).toBe(3);

      act(() => {
        result.current.undo();
      });
      expect(result.current.state).toBe(2);

      act(() => {
        result.current.undo();
      });
      expect(result.current.state).toBe(1);

      act(() => {
        result.current.undo();
      });
      expect(result.current.state).toBe(0);
    });
  });
});
