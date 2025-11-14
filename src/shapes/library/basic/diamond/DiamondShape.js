/**
 * DiamondShape.js - Diamond/Rhombus shape implementation
 *
 * Diamond shape commonly used for decision points in flowcharts.
 *
 * @module shapes/library/basic/diamond/DiamondShape
 */

import { BaseShape } from "../../../base/BaseShape.js";
import { PathGenerator } from "../../../helpers/PathGenerator.js";
import { ShapeRenderer } from "../../../helpers/ShapeRenderer.js";

export class DiamondShape extends BaseShape {
  /**
   * Create a diamond shape
   * @param {Object} config - Shape configuration
   */
  constructor(config = {}) {
    super({
      type: "diamond",
      name: "Diamond",
      category: "basic",
      width: 120,
      height: 100,
      ...config,
    });

    // Set default ports if not provided
    if (!config.ports || config.ports.length === 0) {
      this.ports = [
        { id: "top", x: 0.5, y: 0, type: "input", direction: "top" },
        { id: "right", x: 1, y: 0.5, type: "output", direction: "right" },
        { id: "bottom", x: 0.5, y: 1, type: "output", direction: "bottom" },
        { id: "left", x: 0, y: 0.5, type: "input", direction: "left" },
      ];
    }

    // Set default handles if not provided
    if (!config.handles || config.handles.length === 0) {
      this.handles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
    }
  }

  /**
   * Render the diamond to SVG
   * @returns {SVGElement}
   */
  render() {
    const path = this.getPath();

    const polygon = ShapeRenderer.createSVGElement("path", {
      d: path,
    });

    return polygon;
  }

  /**
   * Get the shape's path for hit detection
   * @returns {string} - SVG path string
   */
  getPath() {
    return PathGenerator.diamond(this.x, this.y, this.width, this.height);
  }

  /**
   * Override containsPoint for accurate diamond hit detection
   * @param {Object} point - {x, y}
   * @returns {boolean}
   */
  containsPoint(point) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    // Transform point to diamond's coordinate system
    const dx = Math.abs(point.x - cx) / (this.width / 2);
    const dy = Math.abs(point.y - cy) / (this.height / 2);

    // Point is inside if sum of normalized distances <= 1
    return dx + dy <= 1;
  }

  /**
   * Get diamond vertices
   * @returns {Array} - Array of {x, y} points
   */
  getVertices() {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    return [
      { x: cx, y: this.y }, // Top
      { x: this.x + this.width, y: cy }, // Right
      { x: cx, y: this.y + this.height }, // Bottom
      { x: this.x, y: cy }, // Left
    ];
  }
}
