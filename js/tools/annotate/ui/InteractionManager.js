// js/tools/annotate/ui/InteractionManager.js

import { TOOLS } from '../utils/constants.js';
import { TextAnnotation } from '../annotations/TextAnnotation.js';
import { ScribbleAnnotation } from '../annotations/ScribbleAnnotation.js';
import { getRectCenter, angle } from '../utils/geometry.js';

/**
 * Handles all mouse and keyboard interactions
 */
export class InteractionManager {
  constructor(stateManager, pdfManager, layerManager, historyManager) {
    this.stateManager = stateManager;
    this.pdfManager = pdfManager;
    this.layerManager = layerManager;
    this.historyManager = historyManager;

    // Interaction state
    this.isDrawing = false;
    this.isDragging = false;
    this.isRotating = false;
    this.isScaling = false;
    this.currentScribble = null;
    this.dragStartPos = null;
    this.rotateStartAngle = null;
    this.scaleStartValue = null;
  }

  /**
   * Initialize event listeners
   */
  init(containerId) {
    const container = document.getElementById(containerId);
    
    // Mouse events
    container.addEventListener('mousedown', this.handleMouseDown.bind(this));
    container.addEventListener('mousemove', this.handleMouseMove.bind(this));
    container.addEventListener('mouseup', this.handleMouseUp.bind(this));
    container.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    container.addEventListener('dblclick', this.handleDoubleClick.bind(this));

    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown.bind(this));

    // Delegate to text annotation DOM elements
    container.addEventListener('mousedown', this.handleTextMouseDown.bind(this), true);
  }

  /**
   * Handle mouse down
   */
  handleMouseDown(event) {
    const tool = this.stateManager.get('currentTool');
    const pageNum = this.pdfManager.getPageFromEvent(event);
    
    if (!pageNum) return;

    if (tool === TOOLS.SCRIBBLE) {
      this.startScribble(event, pageNum);
    }
  }

  /**
   * Handle mouse move
   */
  handleMouseMove(event) {
    if (this.isDrawing && this.currentScribble) {
      this.continueScribble(event);
    }
  }

  /**
   * Handle mouse up
   */
  handleMouseUp(event) {
    if (this.isDrawing && this.currentScribble) {
      this.finishScribble();
    }
  }

  /**
   * Handle double click for text tool
   */
  handleDoubleClick(event) {
    const tool = this.stateManager.get('currentTool');
    const pageNum = this.pdfManager.getPageFromEvent(event);
    
    if (!pageNum) return;

    if (tool === TOOLS.TEXT) {
      this.addTextAnnotation(event, pageNum);
      this.stateManager.set('currentTool', TOOLS.SELECT);
    }
  }

  /**
   * Start drawing scribble
   */
  startScribble(event, pageNum) {
    const coords = this.pdfManager.getPageCoordinates(event, pageNum);
    if (!coords) return;

    this.isDrawing = true;
    this.currentScribble = new ScribbleAnnotation({ page: pageNum });
    this.currentScribble.addPoint(coords.x, coords.y);
  }

  /**
   * Continue drawing scribble
   */
  continueScribble(event) {
    const pageNum = this.currentScribble.page;
    const coords = this.pdfManager.getPageCoordinates(event, pageNum);
    if (!coords) return;

    this.currentScribble.addPoint(coords.x, coords.y);
    
    // Redraw with preview
    this.layerManager.redrawPage(pageNum);
    const canvas = this.layerManager.getLayer(pageNum);
    const ctx = canvas.getContext('2d');
    this.currentScribble.render(ctx, window.devicePixelRatio || 1);
  }

  /**
   * Finish drawing scribble
   */
  finishScribble() {
    if (this.currentScribble && this.currentScribble.stroke.length > 1) {
      this.stateManager.addAnnotation(this.currentScribble);
      this.layerManager.redrawPage(this.currentScribble.page);
      this.historyManager.push();
    }
    
    this.isDrawing = false;
    this.currentScribble = null;
  }

  /**
   * Add text annotation
   */
  addTextAnnotation(event, pageNum) {
    const coords = this.pdfManager.getPageCoordinates(event, pageNum);
    if (!coords) return;

    const textAnnotation = new TextAnnotation({
      page: pageNum,
      x: coords.x,
      y: coords.y
    });

    this.stateManager.addAnnotation(textAnnotation);

    // Create DOM element
    const pageEl = this.pdfManager.getPageElement(pageNum);
    textAnnotation.createDOM(pageEl);

    // Focus for editing
    setTimeout(() => {
      if (textAnnotation.textEl) {
        textAnnotation.textEl.focus();
      }
    }, 10);

    this.historyManager.push();
  }

  /**
   * Handle text annotation DOM interactions
   */
  handleTextMouseDown(event) {
    const wrapper = event.target.closest('.annotation-wrapper');
    if (!wrapper) return;

    const id = wrapper.dataset.id;
    const annotation = this.stateManager.getAnnotation(id);
    if (!annotation || !(annotation instanceof TextAnnotation)) return;

    // Check what was clicked
    const isRotateHandle = event.target.classList.contains('rotate-handle');
    const isScaleHandle = event.target.classList.contains('scale-handle');
    const isText = event.target.classList.contains('annotation-text');

    if (isRotateHandle) {
      this.startRotation(event, annotation);
    } else if (isScaleHandle) {
      this.startScaling(event, annotation);
    } else if (isText) {
      // If text is focused, allow editing
      if (annotation.textEl.matches(':focus')) {
        return;
      }
      // Otherwise, start dragging
      this.startDragging(event, annotation);
    }
  }

  /**
   * Start dragging text annotation
   */
  startDragging(event, annotation) {
    event.preventDefault();
    this.isDragging = true;
    
    const parentRect = annotation.wrapperEl.parentElement.getBoundingClientRect();
    const mouseX = event.clientX - parentRect.left;
    const mouseY = event.clientY - parentRect.top;
    
    // Store offset from annotation's stored position
    this.dragStartPos = {
      offsetX: mouseX - annotation.x,
      offsetY: mouseY - annotation.y
    };

    const onMove = (e) => {
      if (!this.isDragging) return;
      
      const parentRect = annotation.wrapperEl.parentElement.getBoundingClientRect();
      const mouseX = e.clientX - parentRect.left;
      const mouseY = e.clientY - parentRect.top;
      
      annotation.x = mouseX - this.dragStartPos.offsetX;
      annotation.y = mouseY - this.dragStartPos.offsetY;
      annotation.updateDOM();
    };

    const onUp = () => {
      this.isDragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      this.historyManager.push();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  /**
   * Start rotating text annotation
   */
  startRotation(event, annotation) {
    event.preventDefault();
    this.isRotating = true;

    const center = getRectCenter(annotation.wrapperEl.getBoundingClientRect());
    this.rotateStartAngle = angle(center.x, center.y, event.clientX, event.clientY) - annotation.rotation;

    const onMove = (e) => {
      if (!this.isRotating) return;
      
      const center = getRectCenter(annotation.wrapperEl.getBoundingClientRect());
      annotation.rotation = angle(center.x, center.y, e.clientX, e.clientY) - this.rotateStartAngle;
      annotation.updateDOM();
    };

    const onUp = () => {
      this.isRotating = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      this.historyManager.push();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  /**
   * Start scaling text annotation
   */
  startScaling(event, annotation) {
    event.preventDefault();
    this.isScaling = true;
    
    const startY = event.clientY;
    this.scaleStartValue = annotation.scale;

    const onMove = (e) => {
      if (!this.isScaling) return;
      
      const delta = (e.clientY - startY) / 50;
      annotation.scale = Math.max(0.1, this.scaleStartValue + delta);
      annotation.updateDOM();
    };

    const onUp = () => {
      this.isScaling = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      this.historyManager.push();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyDown(event) {
    // Undo: Ctrl+Z
    if (event.ctrlKey && event.key === 'z') {
      event.preventDefault();
      if (this.historyManager.undo()) {
        this.refreshAllAnnotations();
      }
    }

    // Redo: Ctrl+Y
    if (event.ctrlKey && event.key === 'y') {
      event.preventDefault();
      if (this.historyManager.redo()) {
        this.refreshAllAnnotations();
      }
    }

    // Delete: Delete or Backspace
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const activeEl = document.activeElement;
      
      // Don't delete if typing in text
      if (activeEl && activeEl.classList.contains('annotation-text')) {
        return;
      }

      const selectedId = this.stateManager.get('selectedId');
      if (selectedId) {
        event.preventDefault();
        this.deleteAnnotation(selectedId);
      }
    }
  }

  /**
   * Delete annotation
   */
  deleteAnnotation(id) {
    const annotation = this.stateManager.getAnnotation(id);
    if (!annotation) return;

    if (annotation instanceof TextAnnotation) {
      annotation.removeDOM();
    }

    this.stateManager.removeAnnotation(id);
    this.stateManager.set('selectedId', null);
    
    if (annotation.page) {
      this.layerManager.redrawPage(annotation.page);
    }

    this.historyManager.push();
  }

  /**
   * Refresh all annotations after undo/redo
   */
  refreshAllAnnotations() {
    // Remove all text DOM elements
    document.querySelectorAll('.annotation-wrapper').forEach(el => el.remove());

    // Recreate text annotations
    const annotations = this.stateManager.get('annotations');
    annotations.forEach(ann => {
      if (ann instanceof TextAnnotation) {
        const pageEl = this.pdfManager.getPageElement(ann.page);
        if (pageEl) {
          ann.createDOM(pageEl);
        }
      }
    });

    // Redraw all canvas layers
    this.layerManager.redrawAll();
  }
}
