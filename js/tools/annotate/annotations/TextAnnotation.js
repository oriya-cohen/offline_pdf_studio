// js/tools/annotate/annotations/TextAnnotation.js

import { BaseAnnotation } from './BaseAnnotation.js';
import { ANNOTATION_TYPES, DEFAULTS, COLORS, FONTS } from '../utils/constants.js';

/**
 * Text box annotation with rotation and scale handles
 */
export class TextAnnotation extends BaseAnnotation {
  constructor(data) {
    super({ ...data, type: ANNOTATION_TYPES.TEXT });
    this.text = data.text || 'Text';
    this.fontSize = data.fontSize || DEFAULTS.TEXT_SIZE;
    this.color = data.color || DEFAULTS.TEXT_COLOR;
    this.font = data.font || DEFAULTS.TEXT_FONT;
    this.rotation = data.rotation || 0; // in radians
    this.scale = data.scale || 1;
    this.width = data.width || 100;
    this.height = data.height || 30;
    this.isEditing = false;
    
    // DOM elements (not serialized)
    this.wrapperEl = null;
    this.textEl = null;
  }

  /**
   * Create DOM elements for text editing
   */
  createDOM(container) {
    // Wrapper holds text and handles
    this.wrapperEl = document.createElement('div');
    this.wrapperEl.className = 'annotation-wrapper';
    this.wrapperEl.dataset.id = this.id;
    this.wrapperEl.style.position = 'absolute';
    this.wrapperEl.style.left = this.x + 'px';
    this.wrapperEl.style.top = this.y + 'px';
    this.wrapperEl.style.zIndex = '10';
    this.wrapperEl.style.pointerEvents = 'none';
    this.wrapperEl.style.transform = `rotate(${this.rotation}rad) scale(${this.scale})`;
    this.wrapperEl.style.transformOrigin = 'top left';

    // Text element
    this.textEl = document.createElement('div');
    this.textEl.className = 'annotation-text';
    this.textEl.contentEditable = 'true';
    this.textEl.textContent = this.text;
    this.textEl.style.position = 'relative';
    this.textEl.style.padding = '4px';
    this.textEl.style.fontSize = this.fontSize + 'px';
    this.textEl.style.color = this.color;
    this.textEl.style.background = COLORS.BACKGROUND;
    this.textEl.style.border = `1px dashed ${COLORS.TEXT_BORDER}`;
    this.textEl.style.cursor = 'move';
    this.textEl.style.whiteSpace = 'pre-wrap';
    this.textEl.style.minWidth = '50px';
    this.textEl.style.minHeight = '20px';
    this.textEl.style.pointerEvents = 'all';

    // Rotation handle (orange circle with icon)
    const rotateHandle = document.createElement('div');
    rotateHandle.className = 'rotate-handle';
    rotateHandle.style.width = DEFAULTS.HANDLE_SIZE + 'px';
    rotateHandle.style.height = DEFAULTS.HANDLE_SIZE + 'px';
    rotateHandle.style.background = DEFAULTS.ROTATE_HANDLE_COLOR;
    rotateHandle.style.borderRadius = '50%';
    rotateHandle.style.position = 'absolute';
    rotateHandle.style.left = '50%';
    rotateHandle.style.top = '-24px';
    rotateHandle.style.transform = 'translateX(-50%)';
    rotateHandle.style.cursor = 'grab';
    rotateHandle.style.pointerEvents = 'all';
    rotateHandle.style.zIndex = '20';
    rotateHandle.style.display = 'flex';
    rotateHandle.style.alignItems = 'center';
    rotateHandle.style.justifyContent = 'center';
    rotateHandle.style.fontSize = '12px';
    rotateHandle.style.color = 'white';
    rotateHandle.innerHTML = '↻';

    // Scale handle (blue square with icon)
    const scaleHandle = document.createElement('div');
    scaleHandle.className = 'scale-handle';
    scaleHandle.style.width = '10px';
    scaleHandle.style.height = '10px';
    scaleHandle.style.background = DEFAULTS.SCALE_HANDLE_COLOR;
    scaleHandle.style.position = 'absolute';
    scaleHandle.style.right = '-5px';
    scaleHandle.style.bottom = '-5px';
    scaleHandle.style.cursor = 'nwse-resize';
    scaleHandle.style.pointerEvents = 'all';
    scaleHandle.style.zIndex = '20';
    scaleHandle.style.display = 'flex';
    scaleHandle.style.alignItems = 'center';
    scaleHandle.style.justifyContent = 'center';
    scaleHandle.style.fontSize = '8px';
    scaleHandle.style.color = 'white';
    scaleHandle.innerHTML = '⇲';

    this.wrapperEl.appendChild(this.textEl);
    this.wrapperEl.appendChild(rotateHandle);
    this.wrapperEl.appendChild(scaleHandle);
    
    // Add event listeners for editing
    this.textEl.addEventListener('focus', () => {
      this.isEditing = true;
      this.textEl.style.cursor = 'text';
    });
    
    this.textEl.addEventListener('blur', () => {
      this.isEditing = false;
      this.syncFromDOM();
      this.textEl.style.cursor = 'move';
    });
    
    this.textEl.addEventListener('click', (e) => {
      if (!this.isEditing) {
        e.stopPropagation();
        this.textEl.focus();
        const range = document.createRange();
        range.selectNodeContents(this.textEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });

    container.appendChild(this.wrapperEl);

    return this.wrapperEl;
  }

  /**
   * Update DOM position and transform
   */
  updateDOM() {
    if (!this.wrapperEl) return;
    
    // Apply transform to wrapper so handles follow
    this.wrapperEl.style.left = this.x + 'px';
    this.wrapperEl.style.top = this.y + 'px';
    this.wrapperEl.style.transform = `rotate(${this.rotation}rad) scale(${this.scale})`;
    this.wrapperEl.style.transformOrigin = 'top left';
    
    // Remove transform from text element (already on wrapper)
    this.textEl.style.transform = '';
  }

  /**
   * Update text content from DOM
   */
  syncFromDOM() {
    if (this.textEl) {
      this.text = this.textEl.textContent;
      this.touch();
    }
  }

  /**
   * Remove DOM elements
   */
  removeDOM() {
    if (this.wrapperEl && this.wrapperEl.parentNode) {
      this.wrapperEl.parentNode.removeChild(this.wrapperEl);
    }
    this.wrapperEl = null;
    this.textEl = null;
  }

  /**
   * Highlight selection
   */
  setSelected(selected) {
    if (this.wrapperEl) {
      this.wrapperEl.style.outline = selected ? '2px solid orange' : '';
    }
  }

  /**
   * Serialize to plain object
   */
  serialize() {
    // Sync text before serializing
    this.syncFromDOM();
    
    return {
      ...super.serialize(),
      text: this.text,
      fontSize: this.fontSize,
      color: this.color,
      font: this.font,
      rotation: this.rotation,
      scale: this.scale,
      width: this.width,
      height: this.height
    };
  }

  /**
   * Deserialize from plain object
   */
  static deserialize(data) {
    return new TextAnnotation(data);
  }

  /**
   * Get bounding box
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width * this.scale,
      height: this.height * this.scale
    };
  }
}
