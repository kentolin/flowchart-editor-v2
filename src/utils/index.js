/**
 * utils/index.js - Main barrel export for all utilities
 */

export { GeometryUtils } from "./geometry/geometry.js";
export { ValidationUtils } from "./validation/validation.js";
export { DOMUtils } from "./dom/dom.js";
export { MathUtils } from "./math/math.js";

// Re-export commonly used utilities
export const { distance, angle, pointInRect, rectsIntersect, boundingBox } =
  GeometryUtils;

export const { validateNode, validateEdge, validateColor } = ValidationUtils;

export const { createSVGElement, createElement, getMousePosition } = DOMUtils;

export const { clamp, lerp, uuid } = MathUtils;
