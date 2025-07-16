import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onClose: () => void;
  onSave: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export default function useKeyboardShortcuts({
  onClose,
  onSave,
  onUndo,
  onRedo
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape key
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      // Handle Ctrl+S for save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        onSave();
        return;
      }

      // Handle Ctrl+Z for undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey && onUndo) {
        event.preventDefault();
        onUndo();
        return;
      }

      // Handle Ctrl+Y or Ctrl+Shift+Z for redo
      if ((event.ctrlKey || event.metaKey) && 
          ((event.key === 'y') || (event.key === 'z' && event.shiftKey)) && 
          onRedo) {
        event.preventDefault();
        onRedo();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onSave, onUndo, onRedo]);
}