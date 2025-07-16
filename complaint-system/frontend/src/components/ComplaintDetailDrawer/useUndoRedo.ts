import { useState, useCallback } from 'react';

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UseUndoRedoReturn<T> {
  state: T;
  canUndo: boolean;
  canRedo: boolean;
  addState: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  reset: (initialState: T) => void;
}

export default function useUndoRedo<T>(initialState: T, maxHistory = 5): UseUndoRedoReturn<T> {
  const [history, setHistory] = useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: []
  });

  const addState = useCallback((newState: T) => {
    setHistory(prev => ({
      past: [...prev.past.slice(-maxHistory + 1), prev.present].filter(state => state !== null),
      present: newState,
      future: []
    }));
  }, [maxHistory]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);
      
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  const reset = useCallback((initialState: T) => {
    setHistory({
      past: [],
      present: initialState,
      future: []
    });
  }, []);

  return {
    state: history.present,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    addState,
    undo,
    redo,
    reset
  };
}