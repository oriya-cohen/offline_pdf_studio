// js/tools/annotate/annotations/BaseAnnotation.js

/**
 * Base class for all annotation types
 * Provides common properties and methods
 */
export class BaseAnnotation {
  constructor(data) {
    this.id = data.id || crypto.randomUUID();
    this.type = data.type;
    this.page = data.page;
    this.x = data.x || 0;
    this.y = data.y || 0;
    this.createdAt = data.createdAt || Date.now();
    this.modifiedAt = data.modifiedAt || Date.now();
  }

  /**
   * Render annotation on canvas - must be implemented by subclasses
   */
  render(ctx, dpr) {
    throw new Error('render() must be implemented by subclass');
  }

  /**
   * Serialize annotation to plain object for storage
   */
  serialize() {
    return {
      id: this.id,
      type: this.type,
      page: this.page,
      x: this.x,
      y: this.y,
      createdAt: this.createdAt,
      modifiedAt: this.modifiedAt
    };
  }

  /**
   * Update modification timestamp
   */
  touch() {
    this.modifiedAt = Date.now();
  }

  /**
   * Get bounding box - can be overridden by subclasses
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: 0,
      height: 0
    };
  }
}
