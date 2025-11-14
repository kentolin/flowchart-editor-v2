/**
 * TriangleShape.js - Triangle shape implementation
 *
 * Provides a triangle shape with configurable direction (up, down, left, right).
 * Supports all standard shape features including ports, handles, and styling.
 *
 * @module shapes/library/basic/triangle
 */

import { BaseShape } from "../../../base/BaseShape.js";
import { PathGenerator } from "../../../helpers/PathGenerator.js";
import { ShapeRenderer } from "../../../helpers/ShapeRenderer.js";

export class TriangleShape extends BaseShape {
  /**
   * Create a triangle shape
   * @param {Object} config - Shape configuration
   */
  constructor(config = {}) {
    super({
      ...config,
      type: "triangle",
      name: config.name || "Triangle",
      category: "basic",
    });

    // Triangle-specific properties
    this.direction = config.direction || "up"; // 'up', 'down', 'left', 'right'
  }

  /**
   * Render the triangle to SVG
   * @returns {SVGElement}
   */
  render() {
    const path = document.createElementNS(ShapeRenderer.SVG_NS, "path");

    // Generate triangle path based on direction
    const pathString = PathGenerator.triangle(
      this.x,
      this.y,
      this.width,
      this.height,
      this.direction
    );

    path.setAttribute("d", pathString);

    return path;
  }

  /**
   * Get the shape's path for hit detection
   * @returns {string} - SVG path string
   */
  getPath() {
    return PathGenerator.triangle(
      this.x,
      this.y,
      this.width,
      this.height,
      this.direction
    );
  }

  /**
   * Check if a point is inside the triangle
   * Uses more precise triangular hit detection
   * @param {Object} point - {x, y}
   * @returns {boolean}
   */
  containsPoint(point) {
    const bounds = this.getBounds();

    // First check bounding box for quick rejection
    if (!super.containsPoint(point)) {
      return false;
    }

    // Get triangle vertices based on direction
    const vertices = this._getVertices();

    // Use barycentric coordinates for precise triangle hit test
    return this._isPointInTriangle(
      point,
      vertices[0],
      vertices[1],
      vertices[2]
    );
  }

  /**
   * Get triangle vertices based on direction
   * @private
   * @returns {Array} - Array of three {x, y} points
   */
  _getVertices() {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    switch (this.direction) {
      case "up":
        return [
          { x: cx, y: this.y }, // Top point
          { x: this.x + this.width, y: this.y + this.height }, // Bottom right
          { x: this.x, y: this.y + this.height }, // Bottom left
        ];

      case "down":
        return [
          { x: this.x, y: this.y }, // Top left
          { x: this.x + this.width, y: this.y }, // Top right
          { x: cx, y: this.y + this.height }, // Bottom point
        ];

      case "left":
        return [
          { x: this.x, y: cy }, // Left point
          { x: this.x + this.width, y: this.y }, // Top right
          { x: this.x + this.width, y: this.y + this.height }, // Bottom right
        ];

      case "right":
        return [
          { x: this.x, y: this.y }, // Top left
          { x: this.x + this.width, y: cy }, // Right point
          { x: this.x, y: this.y + this.height }, // Bottom left
        ];

      default:
        return this._getVertices.call({ ...this, direction: "up" });
    }
  }

  /**
   * Check if point is inside triangle using barycentric coordinates
   * @private
   */
  _isPointInTriangle(p, v1, v2, v3) {
    const sign = (p1, p2, p3) => {
      return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
    };

    const d1 = sign(p, v1, v2);
    const d2 = sign(p, v2, v3);
    const d3 = sign(p, v3, v1);

    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;

    return !(hasNeg && hasPos);
  }

  /**
   * Set triangle direction
   * @param {string} direction - 'up', 'down', 'left', 'right'
   */
  setDirection(direction) {
    if (["up", "down", "left", "right"].includes(direction)) {
      this.direction = direction;
    }
  }

  /**
   * Get port positions adjusted for triangle shape
   * @returns {Array}
   */
  getPortPositions() {
    if (!this.portsEnabled || this.ports.length === 0) {
      return [];
    }

    // Adjust port positions to be on triangle edges
    const vertices = this._getVertices();
    const bounds = this.getBounds();

    return this.ports.map((port) => {
      let x, y;

      // Place ports on triangle vertices/edges based on relative position
      if (this.direction === "up") {
        if (port.y === 0) {
          // Top edge (actually a point)
          x = bounds.centerX;
          y = bounds.top;
        } else if (port.x === 0) {
          // Left edge
          x = bounds.left + bounds.width * port.x;
          y = bounds.top + bounds.height * port.y;
        } else if (port.x === 1) {
          // Right edge
          x = bounds.left + bounds.width * port.x;
          y = bounds.top + bounds.height * port.y;
        } else {
          // Default: use normal position
          x = bounds.left + bounds.width * port.x;
          y = bounds.top + bounds.height * port.y;
        }
      } else {
        // For other directions, use standard positioning
        x = bounds.left + bounds.width * port.x;
        y = bounds.top + bounds.height * port.y;
      }

      return {
        id: port.id,
        x,
        y,
        type: port.type || "both",
        direction: port.direction || "any",
        relativeX: port.x,
        relativeY: port.y,
      };
    });
  }

  /**
   * Serialize triangle shape
   * @returns {Object}
   */
  serialize() {
    return {
      ...super.serialize(),
      direction: this.direction,
    };
  }

  /**
   * Deserialize triangle shape
   * @param {Object} data - Serialized data
   */
  deserialize(data) {
    super.deserialize(data);
    if (data.direction) {
      this.direction = data.direction;
    }
  }

  /**
   * Clone the triangle
   * @returns {TriangleShape}
   */
  clone() {
    return new TriangleShape(this.serialize());
  }

  /**
   * Get shape-specific info
   * @returns {Object}
   */
  getInfo() {
    return {
      ...super.getInfo(),
      direction: this.direction,
    };
  }
}
