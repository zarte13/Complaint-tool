import { renderHook, act } from '@testing-library/react';
import useUndoRedo from './useUndoRedo';
import { describe, it, expect } from 'vitest';

describe('useUndoRedo', () => {
    it('should return the initial state', () => {
        const { result } = renderHook(() => useUndoRedo<number>(0, 5));
        expect(result.current.state).toBe(0);
    });

    it('should add a new state to the history', () => {
        const { result } = renderHook(() => useUndoRedo<number>(0, 5));

        act(() => {
            result.current.addState(1);
        });

        expect(result.current.state).toBe(1);
    });

    it('should undo to the previous state', () => {
        const { result } = renderHook(() => useUndoRedo<number>(0, 5));

        act(() => {
            result.current.addState(1);
        });

        act(() => {
            result.current.addState(2);
        });

        act(() => {
            result.current.undo();
        });

        expect(result.current.state).toBe(1);
    });

    it('should redo to the next state', () => {
        const { result } = renderHook(() => useUndoRedo<number>(0, 5));

        act(() => {
            result.current.addState(1);
        });

        act(() => {
            result.current.addState(2);
        });

        act(() => {
            result.current.undo();
        });

        act(() => {
            result.current.redo();
        });

        expect(result.current.state).toBe(2);
    });

    it('should not undo if there is no history', () => {
        const { result } = renderHook(() => useUndoRedo<number>(0, 5));

        act(() => {
            result.current.undo();
        });

        expect(result.current.state).toBe(0);
        expect(result.current.canUndo).toBe(false);
    });

    it('should not redo if there is no future', () => {
        const { result } = renderHook(() => useUndoRedo<number>(0, 5));

        act(() => {
            result.current.redo();
        });

        expect(result.current.state).toBe(0);
        expect(result.current.canRedo).toBe(false);
    });

    it('should clear the future when a new state is added', () => {
        const { result } = renderHook(() => useUndoRedo<number>(0, 5));

        act(() => {
            result.current.addState(1);
        });

        act(() => {
            result.current.addState(2);
        });

        act(() => {
            result.current.undo();
        });

        act(() => {
            result.current.addState(3);
        });

        expect(result.current.state).toBe(3);
        expect(result.current.canRedo).toBe(false);
    });

    it('should limit the history to the given capacity', () => {
        const { result } = renderHook(() => useUndoRedo<number>(0, 2));

        act(() => {
            result.current.addState(1);
        });

        act(() => {
            result.current.addState(2);
        });

        act(() => {
            result.current.addState(3);
        });

        act(() => {
            result.current.undo();
        });

        expect(result.current.state).toBe(2);

        act(() => {
            result.current.undo();
        });
        
        expect(result.current.state).toBe(1);
    });
});