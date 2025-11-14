/**
 * TerminatorShape.js - Flowchart Terminator Shape (Rounded Rectangle)
 *
 * Represents the start or end of a flowchart process.
 * Rounded rectangle (stadium shape).
 *
 * @module shapes/library/flowchart/terminator
 */

import { BaseShape } from "../../../base/BaseShape.js";

export class TerminatorShape extends BaseShape {
  constructor(options = {}) {
    super({
      ...options,
      type: "flowchart-terminator",
    });
  }

  /**
   * Render the terminator shape
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

    // Create rounded rectangle (stadium shape)
    const rect = context.document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    const radius = height / 2;

    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("rx", radius);
    rect.setAttribute("ry", radius);
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

    const radius = height / 2;

    // Draw rounded rectangle (stadium shape)
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arc(x + width - radius, y + radius, radius, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(x + radius, y + height);
    ctx.arc(x + radius, y + radius, radius, Math.PI / 2, -Math.PI / 2);
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
   * Get shape path for hit testing
   * @returns {string}
   */
  getPath() {
    const { x, y, width, height } = this.bounds;
    const radius = height / 2;

    return `M ${x + radius} ${y} 
            L ${x + width - radius} ${y} 
            A ${radius} ${radius} 0 0 1 ${x + width - radius} ${y + height} 
            L ${x + radius} ${y + height} 
            A ${radius} ${radius} 0 0 1 ${x + radius} ${y} Z`;
  }

  /**
   * Get port positions for terminator shape
   * @returns {Array}
   */
  getPortPositions() {
    const { x, y, width, height } = this.bounds;
    const centerY = y + height / 2;

    return [
      { id: "left", x: x, y: centerY, type: "input" },
      { id: "right", x: x + width, y: centerY, type: "output" },
    ];
  }

  /**
   * Constrain resize to maintain stadium shape
   * @param {Object} newBounds - New bounds
   * @returns {Object} - Adjusted bounds
   */
  constrainResize(newBounds) {
    // Ensure width is always greater than height for proper stadium shape
    if (newBounds.width < newBounds.height) {
      newBounds.width = newBounds.height;
    }

    return newBounds;
  }
}
