// js/tools/annotate/core/HistoryManager.js

/**
 * Manages undo/redo functionality
 * Stores snapshots of annotation state
 */
export class HistoryManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.undoStack = [];
    this.redoStack = [];
    this.maxStackSize = 50;
  }

  /**
   * Save current state to history
   */
  push() {
    const snapshot = this.stateManager.getSnapshot();
    
    // Don't save duplicate states
    if (this.undoStack.length > 0) {
      const lastSnapshot = this.undoStack[this.undoStack.length - 1];
      if (JSON.stringify(lastSnapshot) === JSON.stringify(snapshot)) {
        return;
      }
    }
    
    this.undoStack.push(snapshot);
    this.redoStack = []; // Clear redo stack on new action
    
    // Limit stack size
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
  }

  /**
   * Undo last action (Ctrl+Z)
   */
  undo() {
    if (this.undoStack.length === 0) {
      return false;
    }

    // Save current state to redo stack before undoing
    const currentSnapshot = this.stateManager.getSnapshot();
    this.redoStack.push(currentSnapshot);
    
    // Restore previous state
    const previousSnapshot = this.undoStack.pop();
    this.stateManager.restoreSnapshot(previousSnapshot);
    
    return true;
  }

  /**
   * Redo last undone action (Ctrl+Y)
   */
  redo() {
    if (this.redoStack.length === 0) {
      return false;
    }

    // Save current state to undo stack before redoing
    const currentSnapshot = this.stateManager.getSnapshot();
    this.undoStack.push(currentSnapshot);
    
    // Restore next state
    const nextSnapshot = this.redoStack.pop();
    this.stateManager.restoreSnapshot(nextSnapshot);
    
    return true;
  }

  /**
   * Clear all history
   */
  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Check if undo is available
   */
  canUndo() {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo() {
    return this.redoStack.length > 0;
  }
}
