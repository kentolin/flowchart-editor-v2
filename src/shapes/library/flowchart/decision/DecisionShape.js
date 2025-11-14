/**
 * DecisionShape.js - Flowchart Decision Shape (Diamond)
 *
 * Represents a decision point or conditional branch in a flowchart.
 * Diamond shape with yes/no or true/false paths.
 *
 * @module shapes/library/flowchart/decision
 */

import { BaseShape } from "../../../base/BaseShape.js";

export class DecisionShape extends BaseShape {
  constructor(options = {}) {
    super({
      ...options,
      type: "flowchart-decision",
    });
  }

  /**
   * Render the decision shape
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

    // Calculate diamond points
    const points = this._calculateDiamondPoints(x, y, width, height);
    const pathData = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y} Z`;

    // Create diamond path
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

    // Calculate diamond points
    const points = this._calculateDiamondPoints(x, y, width, height);

    // Draw diamond
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
   * Calculate diamond corner points
   * @private
   */
  _calculateDiamondPoints(x, y, width, height) {
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    return [
      { x: centerX, y: y }, // Top
      { x: x + width, y: centerY }, // Right
      { x: centerX, y: y + height }, // Bottom
      { x: x, y: centerY }, // Left
    ];
  }

  /**
   * Get shape path for hit testing
   * @returns {string}
   */
  getPath() {
    const { x, y, width, height } = this.bounds;
    const points = this._calculateDiamondPoints(x, y, width, height);

    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y} Z`;
  }

  /**
   * Get port positions for diamond shape
   * @returns {Array}
   */
  getPortPositions() {
    const { x, y, width, height } = this.bounds;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    return [
      { id: "top", x: centerX, y: y, type: "input" },
      { id: "right", x: x + width, y: centerY, type: "output" },
      { id: "bottom", x: centerX, y: y + height, type: "output" },
      { id: "left", x: x, y: centerY, type: "input" },
    ];
  }

  /**
   * Check if point is inside diamond
   * @param {Object} point - {x, y}
   * @returns {boolean}
   */
  containsPoint(point) {
    const { x, y, width, height } = this.bounds;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Transform point to center-based coordinates
    const dx = Math.abs(point.x - centerX);
    const dy = Math.abs(point.y - centerY);

    // Check if point is inside diamond using linear distance formula
    return dx / (width / 2) + dy / (height / 2) <= 1;
  }
}
