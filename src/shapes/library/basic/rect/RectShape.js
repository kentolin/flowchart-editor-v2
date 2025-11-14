/**
 * RectShape.js - Rectangle shape implementation
 *
 * Basic rectangular shape with full port and handle support.
 *
 * @module shapes/library/basic/rect/RectShape
 */

import { BaseShape } from "../../../base/BaseShape.js";
import { PathGenerator } from "../../../helpers/PathGenerator.js";
import { ShapeRenderer } from "../../../helpers/ShapeRenderer.js";

export class RectShape extends BaseShape {
  /**
   * Create a rectangle shape
   * @param {Object} config - Shape configuration
   */
  constructor(config = {}) {
    super({
      type: "rect",
      name: "Rectangle",
      category: "basic",
      width: 120,
      height: 80,
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
   * Render the rectangle to SVG
   * @returns {SVGElement}
   */
  render() {
    const rect = ShapeRenderer.createSVGElement("rect", {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rx: this.data.cornerRadius || 0, // Support for rounded corners
      ry: this.data.cornerRadius || 0,
    });

    return rect;
  }

  /**
   * Get the shape's path for hit detection
   * @returns {string} - SVG path string
   */
  getPath() {
    const cornerRadius = this.data.cornerRadius || 0;

    if (cornerRadius > 0) {
      return PathGenerator.roundedRectangle(
        this.x,
        this.y,
        this.width,
        this.height,
        cornerRadius
      );
    }

    return PathGenerator.rectangle(this.x, this.y, this.width, this.height);
  }

  /**
   * Set corner radius
   * @param {number} radius - Corner radius
   */
  setCornerRadius(radius) {
    this.data.cornerRadius = Math.max(
      0,
      Math.min(radius, Math.min(this.width, this.height) / 2)
    );
  }

  /**
   * Get corner radius
   * @returns {number}
   */
  getCornerRadius() {
    return this.data.cornerRadius || 0;
  }
}
