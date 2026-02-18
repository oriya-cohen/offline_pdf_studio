// js/tools/annotate/annotations/ScribbleAnnotation.js

import { BaseAnnotation } from './BaseAnnotation.js';
import { ANNOTATION_TYPES, DEFAULTS } from '../utils/constants.js';

/**
 * Free-hand drawing annotation
 */
export class ScribbleAnnotation extends BaseAnnotation {
  constructor(data) {
    super({ ...data, type: ANNOTATION_TYPES.SCRIBBLE });
    this.stroke = data.stroke || [];
    this.color = data.color || DEFAULTS.SCRIBBLE_COLOR;
    this.lineWidth = data.lineWidth || DEFAULTS.SCRIBBLE_WIDTH;
  }

  /**
   * Add point to current stroke
   */
  addPoint(x, y) {
    this.stroke.push({ x, y });
    this.touch();
  }

  /**
   * Render scribble on canvas
   */
  render(ctx, dpr) {
    if (this.stroke.length < 2) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    
    ctx.beginPath();
    ctx.moveTo(this.stroke[0].x, this.stroke[0].y);
    
    for (let i = 1; i < this.stroke.length; i++) {
      ctx.lineTo(this.stroke[i].x, this.stroke[i].y);
    }
    
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    ctx.restore();
  }

  /**
   * Serialize to plain object
   */
  serialize() {
    return {
      ...super.serialize(),
      stroke: this.stroke,
      color: this.color,
      lineWidth: this.lineWidth
    };
  }

  /**
   * Deserialize from plain object
   */
  static deserialize(data) {
    return new ScribbleAnnotation(data);
  }

  /**
   * Get bounding box
   */
  getBounds() {
    if (this.stroke.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    this.stroke.forEach(point => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
}
