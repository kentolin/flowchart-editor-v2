/**
 * CircleShape.js - Circle shape implementation
 *
 * Perfect circle shape with aspect ratio constraint.
 *
 * @module shapes/library/basic/circle/CircleShape
 */

import { BaseShape } from "../../../base/BaseShape.js";
import { PathGenerator } from "../../../helpers/PathGenerator.js";
import { ShapeRenderer } from "../../../helpers/ShapeRenderer.js";

export class CircleShape extends BaseShape {
  /**
   * Create a circle shape
   * @param {Object} config - Shape configuration
   */
  constructor(config = {}) {
    super({
      type: "circle",
      name: "Circle",
      category: "basic",
      width: 100,
      height: 100,
      ...config,
      // Force aspect ratio for circle
      constraints: {
        minWidth: 40,
        minHeight: 40,
        maxWidth: 1000,
        maxHeight: 1000,
        aspectRatio: 1, // Force square (circle)
        ...config.constraints,
      },
    });

    // Set default ports if not provided
    if (!config.ports || config.ports.length === 0) {
      this.ports = [
        { id: "top", x: 0.5, y: 0, type: "both", direction: "top" },
        { id: "right", x: 1, y: 0.5, type: "both", direction: "right" },
        { id: "bottom", x: 0.5, y: 1, type: "both", direction: "bottom" },
        { id: "left", x: 0, y: 0.5, type: "both", direction: "left" },
      ];
    }

    // Set default handles if not provided (corners only for proportional resize)
    if (!config.handles || config.handles.length === 0) {
      this.handles = ["nw", "ne", "se", "sw"];
    }
  }

  /**
   * Render the circle to SVG
   * @returns {SVGElement}
   */
  render() {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const r = Math.min(this.width, this.height) / 2;

    const circle = ShapeRenderer.createSVGElement("circle", {
      cx: cx,
      cy: cy,
      r: r,
    });

    return circle;
  }

  /**
   * Get the shape's path for hit detection
   * @returns {string} - SVG path string
   */
  getPath() {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const r = Math.min(this.width, this.height) / 2;

    return PathGenerator.circle(cx, cy, r);
  }

  /**
   * Override setSize to maintain circle (equal width/height)
   * @param {number} width - Width
   * @param {number} height - Height
   */
  setSize(width, height) {
    // Use the larger dimension to maintain circle
    const size = Math.max(width, height);
    super.setSize(size, size);
  }

  /**
   * Get radius
   * @returns {number}
   */
  getRadius() {
    return Math.min(this.width, this.height) / 2;
  }

  /**
   * Set radius
   * @param {number} radius - Radius
   */
  setRadius(radius) {
    const diameter = radius * 2;
    this.setSize(diameter, diameter);
  }

  /**
   * Override containsPoint for accurate circle hit detection
   * @param {Object} point - {x, y}
   * @returns {boolean}
   */
  containsPoint(point) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const r = this.getRadius();

    const dx = point.x - cx;
    const dy = point.y - cy;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= r;
  }
}
