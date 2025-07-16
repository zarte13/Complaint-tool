import { renderHook } from '@testing-library/react';
import useKeyboardShortcuts from './useKeyboardShortcuts';
import { describe, it, expect, vi } from 'vitest';

describe('useKeyboardShortcuts', () => {
    it('should call onClose when Escape is pressed', () => {
        const onClose = vi.fn();
        renderHook(() => useKeyboardShortcuts({ onClose, onSave: vi.fn(), onUndo: vi.fn(), onRedo: vi.fn() }));

        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(event);

        expect(onClose).toHaveBeenCalled();
    });

    it('should call onSave when Ctrl+S is pressed', () => {
        const onSave = vi.fn();
        renderHook(() => useKeyboardShortcuts({ onClose: vi.fn(), onSave, onUndo: vi.fn(), onRedo: vi.fn() }));

        const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
        document.dispatchEvent(event);

        expect(onSave).toHaveBeenCalled();
    });

    it('should call onUndo when Ctrl+Z is pressed', () => {
        const onUndo = vi.fn();
        renderHook(() => useKeyboardShortcuts({ onClose: vi.fn(), onSave: vi.fn(), onUndo, onRedo: vi.fn() }));

        const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
        document.dispatchEvent(event);

        expect(onUndo).toHaveBeenCalled();
    });

    it('should call onRedo when Ctrl+Y is pressed', () => {
        const onRedo = vi.fn();
        renderHook(() => useKeyboardShortcuts({ onClose: vi.fn(), onSave: vi.fn(), onUndo: vi.fn(), onRedo }));

        const event = new KeyboardEvent('keydown', { key: 'y', ctrlKey: true });
        document.dispatchEvent(event);

        expect(onRedo).toHaveBeenCalled();
    });

    it('should call onRedo when Ctrl+Shift+Z is pressed', () => {
        const onRedo = vi.fn();
        renderHook(() => useKeyboardShortcuts({ onClose: vi.fn(), onSave: vi.fn(), onUndo: vi.fn(), onRedo }));

        const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true });
        document.dispatchEvent(event);

        expect(onRedo).toHaveBeenCalled();
    });

    it('should not call any callback when a different key is pressed', () => {
        const onClose = vi.fn();
        const onSave = vi.fn();
        const onUndo = vi.fn();
        const onRedo = vi.fn();
        renderHook(() => useKeyboardShortcuts({ onClose, onSave, onUndo, onRedo }));

        const event = new KeyboardEvent('keydown', { key: 'a' });
        document.dispatchEvent(event);

        expect(onClose).not.toHaveBeenCalled();
        expect(onSave).not.toHaveBeenCalled();
        expect(onUndo).not.toHaveBeenCalled();
        expect(onRedo).not.toHaveBeenCalled();
    });
});