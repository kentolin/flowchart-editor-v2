/**
 * EllipseShape.js - Ellipse/Oval shape implementation
 *
 * Ellipse shape with independent width and height.
 *
 * @module shapes/library/basic/ellipse/EllipseShape
 */

import { BaseShape } from "../../../base/BaseShape.js";
import { PathGenerator } from "../../../helpers/PathGenerator.js";
import { ShapeRenderer } from "../../../helpers/ShapeRenderer.js";

export class EllipseShape extends BaseShape {
  /**
   * Create an ellipse shape
   * @param {Object} config - Shape configuration
   */
  constructor(config = {}) {
    super({
      type: "ellipse",
      name: "Ellipse",
      category: "basic",
      width: 140,
      height: 90,
      ...config,
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

    // Set default handles if not provided
    if (!config.handles || config.handles.length === 0) {
      this.handles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
    }
  }

  /**
   * Render the ellipse to SVG
   * @returns {SVGElement}
   */
  render() {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const rx = this.width / 2;
    const ry = this.height / 2;

    const ellipse = ShapeRenderer.createSVGElement("ellipse", {
      cx: cx,
      cy: cy,
      rx: rx,
      ry: ry,
    });

    return ellipse;
  }

  /**
   * Get the shape's path for hit detection
   * @returns {string} - SVG path string
   */
  getPath() {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const rx = this.width / 2;
    const ry = this.height / 2;

    return PathGenerator.ellipse(cx, cy, rx, ry);
  }

  /**
   * Override containsPoint for accurate ellipse hit detection
   * @param {Object} point - {x, y}
   * @returns {boolean}
   */
  containsPoint(point) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const rx = this.width / 2;
    const ry = this.height / 2;

    // Ellipse equation: ((x-cx)/rx)^2 + ((y-cy)/ry)^2 <= 1
    const normalizedX = (point.x - cx) / rx;
    const normalizedY = (point.y - cy) / ry;

    return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
  }

  /**
   * Get ellipse radii
   * @returns {Object} - {rx, ry}
   */
  getRadii() {
    return {
      rx: this.width / 2,
      ry: this.height / 2,
    };
  }

  /**
   * Set ellipse radii
   * @param {number} rx - X radius
   * @param {number} ry - Y radius
   */
  setRadii(rx, ry) {
    this.setSize(rx * 2, ry * 2);
  }

  /**
   * Get center point
   * @returns {Object} - {x, y}
   */
  getCenter() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
    };
  }

  /**
   * Calculate point on ellipse at angle
   * @param {number} angle - Angle in degrees
   * @returns {Object} - {x, y}
   */
  getPointAtAngle(angle) {
    const center = this.getCenter();
    const radii = this.getRadii();
    const rad = (angle * Math.PI) / 180;

    return {
      x: center.x + radii.rx * Math.cos(rad),
      y: center.y + radii.ry * Math.sin(rad),
    };
  }
}
