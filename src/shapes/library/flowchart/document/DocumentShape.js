/**
 * DocumentShape.js - Flowchart Document Shape
 *
 * Represents a document or report in a flowchart.
 * Rectangle with a wavy bottom edge.
 *
 * @module shapes/library/flowchart/document
 */

import { BaseShape } from "../../../base/BaseShape.js";

export class DocumentShape extends BaseShape {
  constructor(options = {}) {
    super({
      ...options,
      type: "flowchart-document",
    });

    // Wave amplitude (percentage of height)
    this.waveAmplitude = options.waveAmplitude || 0.1;
  }

  /**
   * Render the document shape
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

    // Create document path with wavy bottom
    const pathData = this._createDocumentPath(x, y, width, height);

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

    // Draw document shape
    this._drawDocumentPath(ctx, x, y, width, height);

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
   * Create SVG path for document shape
   * @private
   */
  _createDocumentPath(x, y, width, height) {
    const waveHeight = height * this.waveAmplitude;
    const waveWidth = width / 4;

    // Start at top-left
    let path = `M ${x} ${y}`;

    // Top edge
    path += ` L ${x + width} ${y}`;

    // Right edge
    path += ` L ${x + width} ${y + height - waveHeight}`;

    // Wavy bottom (using quadratic curves)
    path += ` Q ${x + width - waveWidth} ${y + height} ${
      x + width - waveWidth * 2
    } ${y + height - waveHeight}`;
    path += ` Q ${x + width / 2} ${y + height - waveHeight * 2} ${
      x + waveWidth * 2
    } ${y + height - waveHeight}`;
    path += ` Q ${x + waveWidth} ${y + height} ${x} ${y + height - waveHeight}`;

    // Left edge back to start
    path += ` Z`;

    return path;
  }

  /**
   * Draw document path on canvas
   * @private
   */
  _drawDocumentPath(ctx, x, y, width, height) {
    const waveHeight = height * this.waveAmplitude;
    const waveWidth = width / 4;

    ctx.beginPath();

    // Start at top-left
    ctx.moveTo(x, y);

    // Top edge
    ctx.lineTo(x + width, y);

    // Right edge
    ctx.lineTo(x + width, y + height - waveHeight);

    // Wavy bottom
    ctx.quadraticCurveTo(
      x + width - waveWidth,
      y + height,
      x + width - waveWidth * 2,
      y + height - waveHeight
    );
    ctx.quadraticCurveTo(
      x + width / 2,
      y + height - waveHeight * 2,
      x + waveWidth * 2,
      y + height - waveHeight
    );
    ctx.quadraticCurveTo(x + waveWidth, y + height, x, y + height - waveHeight);

    // Left edge
    ctx.closePath();
  }

  /**
   * Get shape path for hit testing
   * @returns {string}
   */
  getPath() {
    const { x, y, width, height } = this.bounds;
    return this._createDocumentPath(x, y, width, height);
  }

  /**
   * Get port positions for document shape
   * @returns {Array}
   */
  getPortPositions() {
    const { x, y, width, height } = this.bounds;
    const waveHeight = height * this.waveAmplitude;

    return [
      { id: "top", x: x + width / 2, y: y, type: "input" },
      { id: "right", x: x + width, y: y + height / 2, type: "output" },
      {
        id: "bottom",
        x: x + width / 2,
        y: y + height - waveHeight / 2,
        type: "output",
      },
      { id: "left", x: x, y: y + height / 2, type: "input" },
    ];
  }

  /**
   * Serialize shape data
   * @returns {Object}
   */
  serialize() {
    return {
      ...super.serialize(),
      waveAmplitude: this.waveAmplitude,
    };
  }

  /**
   * Deserialize shape data
   * @param {Object} data
   */
  deserialize(data) {
    super.deserialize(data);
    this.waveAmplitude = data.waveAmplitude || 0.1;
  }
}
