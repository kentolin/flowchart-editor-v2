/**
 * ServerShape.js - Network Server Shape
 *
 * Represents a server in network diagrams.
 * Rectangle with horizontal dividers representing server rack.
 *
 * @module shapes/library/network/server
 */

import { BaseShape } from "../../../base/BaseShape.js";

export class ServerShape extends BaseShape {
  constructor(options = {}) {
    super({
      ...options,
      type: "network-server",
    });

    // Number of server units
    this.units = options.units || 3;
  }

  /**
   * Render the server shape
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

    // Create outer rectangle
    const rect = context.document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", style.fill);
    rect.setAttribute("stroke", style.stroke);
    rect.setAttribute("stroke-width", style.strokeWidth);
    rect.setAttribute("opacity", style.opacity);

    group.appendChild(rect);

    // Add horizontal dividers
    const unitHeight = height / this.units;
    for (let i = 1; i < this.units; i++) {
      const line = context.document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", x);
      line.setAttribute("y1", y + unitHeight * i);
      line.setAttribute("x2", x + width);
      line.setAttribute("y2", y + unitHeight * i);
      line.setAttribute("stroke", style.stroke);
      line.setAttribute("stroke-width", style.strokeWidth);

      group.appendChild(line);
    }

    // Add indicator lights (small circles)
    const indicatorSize = 4;
    const indicatorMargin = 10;
    for (let i = 0; i < this.units; i++) {
      const cy = y + unitHeight * i + unitHeight / 2;

      // Green indicator
      const greenLight = context.document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      greenLight.setAttribute("cx", x + indicatorMargin);
      greenLight.setAttribute("cy", cy);
      greenLight.setAttribute("r", indicatorSize);
      greenLight.setAttribute("fill", "#4caf50");
      group.appendChild(greenLight);

      // Yellow indicator
      const yellowLight = context.document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      yellowLight.setAttribute("cx", x + indicatorMargin + indicatorSize * 3);
      yellowLight.setAttribute("cy", cy);
      yellowLight.setAttribute("r", indicatorSize);
      yellowLight.setAttribute("fill", "#ffc107");
      group.appendChild(yellowLight);
    }

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

    // Draw outer rectangle
    ctx.fillStyle = style.fill;
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = style.strokeWidth;
    ctx.strokeRect(x, y, width, height);

    // Draw horizontal dividers
    const unitHeight = height / this.units;
    for (let i = 1; i < this.units; i++) {
      ctx.beginPath();
      ctx.moveTo(x, y + unitHeight * i);
      ctx.lineTo(x + width, y + unitHeight * i);
      ctx.stroke();
    }

    // Draw indicator lights
    const indicatorSize = 4;
    const indicatorMargin = 10;
    for (let i = 0; i < this.units; i++) {
      const cy = y + unitHeight * i + unitHeight / 2;

      // Green indicator
      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.arc(x + indicatorMargin, cy, indicatorSize, 0, Math.PI * 2);
      ctx.fill();

      // Yellow indicator
      ctx.fillStyle = "#ffc107";
      ctx.beginPath();
      ctx.arc(
        x + indicatorMargin + indicatorSize * 3,
        cy,
        indicatorSize,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

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
    return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${
      y + height
    } L ${x} ${y + height} Z`;
  }

  /**
   * Serialize shape data
   * @returns {Object}
   */
  serialize() {
    return {
      ...super.serialize(),
      units: this.units,
    };
  }

  /**
   * Deserialize shape data
   * @param {Object} data
   */
  deserialize(data) {
    super.deserialize(data);
    this.units = data.units || 3;
  }
}
