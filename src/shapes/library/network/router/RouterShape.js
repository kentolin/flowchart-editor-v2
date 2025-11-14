/**
 * RouterShape.js - Network Router Shape
 *
 * Represents a router in network diagrams.
 * Cylinder shape with antenna indicators.
 *
 * @module shapes/library/network/router
 */

import { BaseShape } from "../../../base/BaseShape.js";

export class RouterShape extends BaseShape {
  constructor(options = {}) {
    super({
      ...options,
      type: "network-router",
    });

    // Number of antennas
    this.antennas = options.antennas || 2;
  }

  /**
   * Render the router shape
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

    const bodyHeight = height * 0.7;
    const ellipseRy = height * 0.15;

    // Create router body (rounded rectangle)
    const rect = context.document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    rect.setAttribute("x", x);
    rect.setAttribute("y", y + ellipseRy);
    rect.setAttribute("width", width);
    rect.setAttribute("height", bodyHeight);
    rect.setAttribute("rx", 5);
    rect.setAttribute("fill", style.fill);
    rect.setAttribute("stroke", style.stroke);
    rect.setAttribute("stroke-width", style.strokeWidth);

    group.appendChild(rect);

    // Top ellipse
    const topEllipse = context.document.createElementNS(
      "http://www.w3.org/2000/svg",
      "ellipse"
    );
    topEllipse.setAttribute("cx", x + width / 2);
    topEllipse.setAttribute("cy", y + ellipseRy);
    topEllipse.setAttribute("rx", width / 2);
    topEllipse.setAttribute("ry", ellipseRy);
    topEllipse.setAttribute("fill", style.fill);
    topEllipse.setAttribute("stroke", style.stroke);
    topEllipse.setAttribute("stroke-width", style.strokeWidth);

    group.appendChild(topEllipse);

    // Draw antennas
    const antennaHeight = height * 0.3;
    const antennaSpacing = width / (this.antennas + 1);

    for (let i = 1; i <= this.antennas; i++) {
      const antennaX = x + antennaSpacing * i;
      const antennaY = y + ellipseRy;

      // Antenna line
      const antenna = context.document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      antenna.setAttribute("x1", antennaX);
      antenna.setAttribute("y1", antennaY);
      antenna.setAttribute("x2", antennaX);
      antenna.setAttribute("y2", antennaY - antennaHeight);
      antenna.setAttribute("stroke", style.stroke);
      antenna.setAttribute("stroke-width", 2);

      group.appendChild(antenna);

      // Antenna tip (small circle)
      const tip = context.document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      tip.setAttribute("cx", antennaX);
      tip.setAttribute("cy", antennaY - antennaHeight);
      tip.setAttribute("r", 3);
      tip.setAttribute("fill", style.stroke);

      group.appendChild(tip);
    }

    // Add indicator lights
    const indicatorY = y + ellipseRy + bodyHeight / 2;
    const indicatorSize = 3;
    for (let i = 0; i < 4; i++) {
      const light = context.document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      light.setAttribute("cx", x + 10 + i * 8);
      light.setAttribute("cy", indicatorY);
      light.setAttribute("r", indicatorSize);
      light.setAttribute("fill", i < 2 ? "#4caf50" : "#9e9e9e");

      group.appendChild(light);
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

    const bodyHeight = height * 0.7;
    const ellipseRy = height * 0.15;

    // Draw router body
    ctx.fillStyle = style.fill;
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = style.strokeWidth;

    // Body rectangle
    ctx.beginPath();
    ctx.roundRect(x, y + ellipseRy, width, bodyHeight, 5);
    ctx.fill();
    ctx.stroke();

    // Top ellipse
    ctx.beginPath();
    ctx.ellipse(
      x + width / 2,
      y + ellipseRy,
      width / 2,
      ellipseRy,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    // Draw antennas
    const antennaHeight = height * 0.3;
    const antennaSpacing = width / (this.antennas + 1);

    ctx.lineWidth = 2;
    for (let i = 1; i <= this.antennas; i++) {
      const antennaX = x + antennaSpacing * i;
      const antennaY = y + ellipseRy;

      // Antenna line
      ctx.beginPath();
      ctx.moveTo(antennaX, antennaY);
      ctx.lineTo(antennaX, antennaY - antennaHeight);
      ctx.stroke();

      // Antenna tip
      ctx.fillStyle = style.stroke;
      ctx.beginPath();
      ctx.arc(antennaX, antennaY - antennaHeight, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw indicator lights
    const indicatorY = y + ellipseRy + bodyHeight / 2;
    const indicatorSize = 3;
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i < 2 ? "#4caf50" : "#9e9e9e";
      ctx.beginPath();
      ctx.arc(x + 10 + i * 8, indicatorY, indicatorSize, 0, Math.PI * 2);
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
    const bodyHeight = height * 0.7;
    const ellipseRy = height * 0.15;

    // Simplified bounding box
    return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${
      y + ellipseRy + bodyHeight
    } L ${x} ${y + ellipseRy + bodyHeight} Z`;
  }

  /**
   * Serialize shape data
   * @returns {Object}
   */
  serialize() {
    return {
      ...super.serialize(),
      antennas: this.antennas,
    };
  }

  /**
   * Deserialize shape data
   * @param {Object} data
   */
  deserialize(data) {
    super.deserialize(data);
    this.antennas = data.antennas || 2;
  }
}
