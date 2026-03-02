// js/tools/annotate/core/LayerManager.js

import { DPR } from '../utils/constants.js';

/**
 * Manages canvas layers for annotations on each page
 */
export class LayerManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.layers = new Map(); // pageNum -> canvas element
    this.viewports = new Map(); // pageNum -> viewport info
  }

  /**
   * Create annotation canvas layer for a page
   */
  createLayer(pageNum, viewport) {
    const canvas = document.createElement('canvas');
    canvas.className = 'annotation-layer';
    canvas.dataset.page = pageNum;
    canvas.width = viewport.width * DPR;
    canvas.height = viewport.height * DPR;
    canvas.style.width = viewport.width + 'px';
    canvas.style.height = viewport.height + 'px';
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.zIndex = '1';
    canvas.style.pointerEvents = 'none';

    this.layers.set(pageNum, canvas);
    this.viewports.set(pageNum, { width: viewport.width, height: viewport.height });
    return canvas;
  }

  /**
   * Get viewport info for a page
   */
  getViewport(pageNum) {
    return this.viewports.get(pageNum);
  }

  /**
   * Get canvas layer for a page
   */
  getLayer(pageNum) {
    return this.layers.get(pageNum);
  }

  /**
   * Redraw annotations on a specific page
   */
  redrawPage(pageNum) {
    const canvas = this.layers.get(pageNum);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get annotations for this page
    const annotations = this.stateManager.getPageAnnotations(pageNum);

    // Render each annotation (only canvas-based ones)
    annotations.forEach(annotation => {
      // Skip TextAnnotation (uses DOM, not canvas)
      if (annotation.type === 'text') return;
      
      if (annotation.render) {
        annotation.render(ctx, DPR);
      }
    });
  }

  /**
   * Redraw all pages
   */
  redrawAll() {
    this.layers.forEach((canvas, pageNum) => {
      this.redrawPage(pageNum);
    });
  }

  /**
   * Clear all layers
   */
  clear() {
    this.layers.clear();
    this.viewports.clear();
  }

  /**
   * Get all page numbers with layers
   */
  getPageNumbers() {
    return Array.from(this.layers.keys());
  }
}
