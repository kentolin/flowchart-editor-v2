/**
 * DataShape.js - Flowchart Data Shape (Parallelogram)
 *
 * Represents data input or output in a flowchart.
 * Parallelogram shape with configurable skew.
 *
 * @module shapes/library/flowchart/data
 */

import { BaseShape } from "../../../base/BaseShape.js";

export class DataShape extends BaseShape {
  constructor(options = {}) {
    super({
      ...options,
      type: "flowchart-data",
    });

    // Skew amount (0-1, where 0.2 means 20% of width)
    this.skew = options.skew || 0.2;
  }

  /**
   * Render the data shape
   * @param {Object} context - Rendering context (SVG or Canvas)
   * @returns {SVGElement|void}
   */
  render(context) {
    if (context.type === "svg") {
      return this._renderSVG(context);
    } else if (context.type === "canvas") {
      return this._renderCanvas(context);
    }
  }

  /**
   * Render as SVG
   * @private
   */
  _renderSVG(context) {
    const { x, y, width, height } = this.bounds;
    const style = this.getComputedStyle();

    const group = context.document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    group.setAttribute("data-node-id", this.id);

    // Calculate parallelogram points
    const points = this._calculateParallelogramPoints(x, y, width, height);
    const pathData = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y} Z`;

    // Create parallelogram path
    const path = context.document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    path.setAttribute("d", pathData);
    path.setAttribute("fill", style.fill);
    path.setAttribute("stroke", style.stroke);
    path.setAttribute("stroke-width", style.strokeWidth);
    path.setAttribute("opacity", style.opacity);

    group.appendChild(path);

    // Add label if present
    if (this.label) {
      const text = this._createTextElement(context.document, style);
      group.appendChild(text);
    }

    return group;
  }

  /**
   * Render on canvas
   * @private
   */
  _renderCanvas(context) {
    const { x, y, width, height } = this.bounds;
    const style = this.getComputedStyle();
    const ctx = context.ctx;

    ctx.save();

    // Calculate parallelogram points
    const points = this._calculateParallelogramPoints(x, y, width, height);

    // Draw parallelogram
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.lineTo(points[3].x, points[3].y);
    ctx.closePath();

    // Fill
    ctx.fillStyle = style.fill;
    ctx.fill();

    // Stroke
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = style.strokeWidth;
    ctx.stroke();

    // Draw label
    if (this.label) {
      this._drawText(ctx, style);
    }

    ctx.restore();
  }

  /**
   * Calculate parallelogram corner points
   * @private
   */
  _calculateParallelogramPoints(x, y, width, height) {
    const skewOffset = width * this.skew;

    return [
      { x: x + skewOffset, y: y }, // Top left
      { x: x + width, y: y }, // Top right
      { x: x + width - skewOffset, y: y + height }, // Bottom right
      { x: x, y: y + height }, // Bottom left
    ];
  }

  /**
   * Get shape path for hit testing
   * @returns {string}
   */
  getPath() {
    const { x, y, width, height } = this.bounds;
    const points = this._calculateParallelogramPoints(x, y, width, height);

    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y} Z`;
  }

  /**
   * Get port positions for parallelogram shape
   * @returns {Array}
   */
  getPortPositions() {
    const { x, y, width, height } = this.bounds;
    const skewOffset = width * this.skew;
    const centerY = y + height / 2;

    return [
      { id: "top", x: x + width / 2, y: y, type: "input" },
      {
        id: "right",
        x: x + width - skewOffset / 2,
        y: centerY,
        type: "output",
      },
      { id: "bottom", x: x + width / 2, y: y + height, type: "output" },
      { id: "left", x: x + skewOffset / 2, y: centerY, type: "input" },
    ];
  }

  /**
   * Check if point is inside parallelogram
   * @param {Object} point - {x, y}
   * @returns {boolean}
   */
  containsPoint(point) {
    const { x, y, width, height } = this.bounds;
    const points = this._calculateParallelogramPoints(x, y, width, height);

    // Use ray casting algorithm
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x,
        yi = points[i].y;
      const xj = points[j].x,
        yj = points[j].y;

      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * Serialize shape data
   * @returns {Object}
   */
  serialize() {
    return {
      ...super.serialize(),
      skew: this.skew,
    };
  }

  /**
   * Deserialize shape data
   * @param {Object} data
   */
  deserialize(data) {
    super.deserialize(data);
    this.skew = data.skew || 0.2;
  }
}
