// js/tools/annotate/utils/geometry.js

/**
 * Calculate distance between two points
 */
export function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Calculate angle between two points in radians
 */
export function angle(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Check if point is inside rectangle
 */
export function pointInRect(px, py, rect) {
  return px >= rect.x && 
         px <= rect.x + rect.width &&
         py >= rect.y && 
         py <= rect.y + rect.height;
}

/**
 * Check if point is inside rotated rectangle
 */
export function pointInRotatedRect(px, py, rect, rotation) {
  // Translate point to rect's coordinate system
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  
  // Rotate point back
  const rotatedPoint = rotatePoint(px, py, cx, cy, -rotation);
  
  // Check if in non-rotated rect
  return pointInRect(rotatedPoint.x, rotatedPoint.y, rect);
}

/**
 * Rotate a point around a center
 */
export function rotatePoint(px, py, cx, cy, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = px - cx;
  const dy = py - cy;
  
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos
  };
}

/**
 * Get center point of rectangle
 */
export function getRectCenter(rect) {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2
  };
}

/**
 * Convert radians to degrees
 */
export function radToDeg(rad) {
  return rad * (180 / Math.PI);
}

/**
 * Convert degrees to radians
 */
export function degToRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Get bounding box of rotated rectangle
 */
export function getRotatedBounds(x, y, width, height, rotation) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  
  // Get all four corners
  const corners = [
    rotatePoint(x, y, cx, cy, rotation),
    rotatePoint(x + width, y, cx, cy, rotation),
    rotatePoint(x + width, y + height, cx, cy, rotation),
    rotatePoint(x, y + height, cx, cy, rotation)
  ];
  
  // Find min/max
  const xs = corners.map(c => c.x);
  const ys = corners.map(c => c.y);
  
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys)
  };
}
