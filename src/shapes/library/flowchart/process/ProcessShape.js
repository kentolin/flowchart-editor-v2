/**
 * ProcessShape.js - Flowchart Process Shape (Rectangle)
 *
 * Represents a process or action step in a flowchart.
 * Standard rectangle with configurable dimensions.
 *
 * @module shapes/library/flowchart/process
 */

import { BaseShape } from "../../../base/BaseShape.js";

export class ProcessShape extends BaseShape {
  constructor(options = {}) {
    super({
      ...options,
      type: "flowchart-process",
    });

    // Process-specific properties
    this.cornerRadius = options.cornerRadius || 0;
  }

  /**
   * Render the process shape
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

    // Create rectangle
    const rect = context.document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("rx", this.cornerRadius);
    rect.setAttribute("ry", this.cornerRadius);
    rect.setAttribute("fill", style.fill);
    rect.setAttribute("stroke", style.stroke);
    rect.setAttribute("stroke-width", style.strokeWidth);
    rect.setAttribute("opacity", style.opacity);

    group.appendChild(rect);

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

    // Draw rectangle
    ctx.beginPath();
    if (this.cornerRadius > 0) {
      this._drawRoundedRect(ctx, x, y, width, height, this.cornerRadius);
    } else {
      ctx.rect(x, y, width, height);
    }

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
   * Draw rounded rectangle
   * @private
   */
  _drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }

  /**
   * Get shape path for hit testing
   * @returns {Path2D|string}
   */
  getPath() {
    const { x, y, width, height } = this.bounds;

    if (this.cornerRadius > 0) {
      // SVG path for rounded rectangle
      return `M ${x + this.cornerRadius} ${y} 
              L ${x + width - this.cornerRadius} ${y} 
              Q ${x + width} ${y} ${x + width} ${y + this.cornerRadius} 
              L ${x + width} ${y + height - this.cornerRadius} 
              Q ${x + width} ${y + height} ${x + width - this.cornerRadius} ${
        y + height
      } 
              L ${x + this.cornerRadius} ${y + height} 
              Q ${x} ${y + height} ${x} ${y + height - this.cornerRadius} 
              L ${x} ${y + this.cornerRadius} 
              Q ${x} ${y} ${x + this.cornerRadius} ${y} Z`;
    } else {
      return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${
        y + height
      } L ${x} ${y + height} Z`;
    }
  }

  /**
   * Serialize shape data
   * @returns {Object}
   */
  serialize() {
    return {
      ...super.serialize(),
      cornerRadius: this.cornerRadius,
    };
  }

  /**
   * Deserialize shape data
   * @param {Object} data
   */
  deserialize(data) {
    super.deserialize(data);
    this.cornerRadius = data.cornerRadius || 0;
  }
}
