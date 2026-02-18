// js/tools/annotate/core/StateManager.js

import { TOOLS } from '../utils/constants.js';
import { TextAnnotation } from '../annotations/TextAnnotation.js';
import { ScribbleAnnotation } from '../annotations/ScribbleAnnotation.js';

/**
 * Centralized state management with simple observer pattern
 */
export class StateManager {
  constructor() {
    this.state = {
      pdfDocument: null,
      currentTool: TOOLS.SELECT,
      annotations: [],
      selectedId: null
    };
    
    this.listeners = new Map();
  }

  /**
   * Get current state value
   */
  get(key) {
    return this.state[key];
  }

  /**
   * Set state value and notify listeners
   */
  set(key, value) {
    this.state[key] = value;
    this.notify(key, value);
  }

  /**
   * Add annotation to state
   */
  addAnnotation(annotation) {
    this.state.annotations.push(annotation);
    this.notify('annotations', this.state.annotations);
  }

  /**
   * Remove annotation from state
   */
  removeAnnotation(id) {
    this.state.annotations = this.state.annotations.filter(a => a.id !== id);
    this.notify('annotations', this.state.annotations);
  }

  /**
   * Get annotation by ID
   */
  getAnnotation(id) {
    return this.state.annotations.find(a => a.id === id);
  }

  /**
   * Get annotations for specific page
   */
  getPageAnnotations(pageNum) {
    return this.state.annotations.filter(a => a.page === pageNum);
  }

  /**
   * Subscribe to state changes
   */
  on(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(callback);
  }

  /**
   * Notify listeners of state change
   */
  notify(key, value) {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach(cb => cb(value));
    }
  }

  /**
   * Get complete state snapshot for history
   */
  getSnapshot() {
    return {
      annotations: this.state.annotations.map(a => {
        // If already serialized, return as-is
        if (typeof a.serialize === 'function') {
          return a.serialize();
        }
        // Already a plain object
        return a;
      }),
      selectedId: this.state.selectedId
    };
  }

  /**
   * Restore state from snapshot
   */
  restoreSnapshot(snapshot) {
    // Deserialize annotations back to class instances
    this.state.annotations = snapshot.annotations.map(data => {
      if (data.type === 'text') {
        return new TextAnnotation(data);
      } else if (data.type === 'scribble') {
        return new ScribbleAnnotation(data);
      }
      return data;
    });
    
    this.state.selectedId = snapshot.selectedId;
    this.notify('annotations', this.state.annotations);
    this.notify('selectedId', this.state.selectedId);
  }
}
