/**
 * ShapeRenderer.js - Rendering utilities for shapes
 *
 * Provides methods for rendering shapes to SVG and Canvas contexts.
 * Handles common rendering tasks like applying styles, transforms, etc.
 *
 * @module shapes/helpers/ShapeRenderer
 */

export class ShapeRenderer {
  /**
   * Create SVG namespace URI
   */
  static SVG_NS = "http://www.w3.org/2000/svg";

  /**
   * Render shape to SVG element
   * @param {BaseShape} shape - Shape to render
   * @returns {SVGElement}
   */
  static toSVG(shape) {
    // This calls the shape's own render method
    const element = shape.render();

    // Apply common attributes
    ShapeRenderer.applySVGAttributes(element, shape);

    return element;
  }

  /**
   * Apply common SVG attributes to element
   * @param {SVGElement} element - SVG element
   * @param {BaseShape} shape - Shape instance
   */
  static applySVGAttributes(element, shape) {
    // Transform (position and rotation)
    if (shape.rotation !== 0) {
      const bounds = shape.getBounds();
      const transform = `rotate(${shape.rotation} ${bounds.centerX} ${bounds.centerY})`;
      element.setAttribute("transform", transform);
    }

    // Style
    if (shape.style.fill) {
      element.setAttribute("fill", shape.style.fill);
    }
    if (shape.style.stroke) {
      element.setAttribute("stroke", shape.style.stroke);
    }
    if (shape.style.strokeWidth) {
      element.setAttribute("stroke-width", shape.style.strokeWidth);
    }
    if (shape.style.opacity !== undefined && shape.style.opacity !== 1) {
      element.setAttribute("opacity", shape.style.opacity);
    }

    // Visibility
    if (!shape.visible) {
      element.setAttribute("visibility", "hidden");
    }

    // Selection/hover state classes
    const classes = [];
    if (shape.selected) classes.push("selected");
    if (shape.hovered) classes.push("hovered");
    if (shape.locked) classes.push("locked");
    if (classes.length > 0) {
      element.setAttribute("class", classes.join(" "));
    }

    // Data attributes
    element.setAttribute("data-shape-id", shape.id);
    element.setAttribute("data-shape-type", shape.type);
  }

  /**
   * Render shape text/label to SVG
   * @param {BaseShape} shape - Shape instance
   * @returns {SVGTextElement}
   */
  static renderSVGText(shape) {
    if (!shape.label) return null;

    const text = document.createElementNS(ShapeRenderer.SVG_NS, "text");
    const bounds = shape.getBounds();

    // Position text at center
    text.setAttribute("x", bounds.centerX);
    text.setAttribute("y", bounds.centerY);

    // Text anchor
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");

    // Style
    text.setAttribute("fill", shape.textStyle.color);
    text.setAttribute("font-size", shape.textStyle.fontSize);
    text.setAttribute("font-family", shape.textStyle.fontFamily);
    text.setAttribute("font-weight", shape.textStyle.fontWeight);

    // Content
    text.textContent = shape.label;

    // Prevent text selection
    text.style.userSelect = "none";
    text.style.pointerEvents = "none";

    return text;
  }

  /**
   * Render shape ports to SVG
   * @param {BaseShape} shape - Shape instance
   * @returns {SVGGElement} - Group containing all ports
   */
  static renderSVGPorts(shape) {
    const group = document.createElementNS(ShapeRenderer.SVG_NS, "g");
    group.setAttribute("class", "ports");

    const ports = shape.getPortPositions();

    ports.forEach((port) => {
      const circle = document.createElementNS(ShapeRenderer.SVG_NS, "circle");
      circle.setAttribute("cx", port.x);
      circle.setAttribute("cy", port.y);
      circle.setAttribute("r", 4);
      circle.setAttribute("fill", "#2196f3");
      circle.setAttribute("stroke", "#ffffff");
      circle.setAttribute("stroke-width", 2);
      circle.setAttribute("class", `port port-${port.type}`);
      circle.setAttribute("data-port-id", port.id);
      circle.setAttribute("data-port-type", port.type);

      group.appendChild(circle);
    });

    return group;
  }

  /**
   * Render shape handles to SVG
   * @param {BaseShape} shape - Shape instance
   * @returns {SVGGElement} - Group containing all handles
   */
  static renderSVGHandles(shape) {
    const group = document.createElementNS(ShapeRenderer.SVG_NS, "g");
    group.setAttribute("class", "handles");

    const handles = shape.getHandlePositions();

    handles.forEach((handle) => {
      const rect = document.createElementNS(ShapeRenderer.SVG_NS, "rect");
      rect.setAttribute("x", handle.x - 4);
      rect.setAttribute("y", handle.y - 4);
      rect.setAttribute("width", 8);
      rect.setAttribute("height", 8);
      rect.setAttribute("fill", "#ffffff");
      rect.setAttribute("stroke", "#2196f3");
      rect.setAttribute("stroke-width", 2);
      rect.setAttribute("class", `handle handle-${handle.id}`);
      rect.setAttribute("data-handle-id", handle.id);
      rect.style.cursor = handle.cursor;

      group.appendChild(rect);
    });

    return group;
  }

  /**
   * Render complete shape group with text, ports, handles
   * @param {BaseShape} shape - Shape instance
   * @param {Object} options - Rendering options
   * @returns {SVGGElement}
   */
  static renderComplete(shape, options = {}) {
    const { showText = true, showPorts = false, showHandles = false } = options;

    const group = document.createElementNS(ShapeRenderer.SVG_NS, "g");
    group.setAttribute("data-shape-id", shape.id);
    group.setAttribute("class", "shape-group");

    // Main shape
    const shapeElement = shape.render();
    ShapeRenderer.applySVGAttributes(shapeElement, shape);
    group.appendChild(shapeElement);

    // Text
    if (showText && shape.label) {
      const text = ShapeRenderer.renderSVGText(shape);
      if (text) group.appendChild(text);
    }

    // Ports
    if (showPorts && shape.portsEnabled) {
      const ports = ShapeRenderer.renderSVGPorts(shape);
      if (ports) group.appendChild(ports);
    }

    // Handles
    if (showHandles && shape.handlesEnabled && shape.features.resizable) {
      const handles = ShapeRenderer.renderSVGHandles(shape);
      if (handles) group.appendChild(handles);
    }

    return group;
  }

  /**
   * Render shape to Canvas context
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {BaseShape} shape - Shape to render
   */
  static toCanvas(ctx, shape) {
    ctx.save();

    // Apply transform
    const bounds = shape.getBounds();
    if (shape.rotation !== 0) {
      ctx.translate(bounds.centerX, bounds.centerY);
      ctx.rotate((shape.rotation * Math.PI) / 180);
      ctx.translate(-bounds.centerX, -bounds.centerY);
    }

    // Apply style
    ctx.fillStyle = shape.style.fill;
    ctx.strokeStyle = shape.style.stroke;
    ctx.lineWidth = shape.style.strokeWidth;
    ctx.globalAlpha = shape.style.opacity;

    // Get path from shape
    const path = shape.getPath();

    // Draw using Path2D or path string
    if (path instanceof Path2D) {
      ctx.fill(path);
      ctx.stroke(path);
    } else if (typeof path === "string") {
      // Parse SVG path string and draw
      const path2d = new Path2D(path);
      ctx.fill(path2d);
      ctx.stroke(path2d);
    }

    // Draw text
    if (shape.label) {
      ShapeRenderer.drawCanvasText(ctx, shape);
    }

    ctx.restore();
  }

  /**
   * Draw text on canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {BaseShape} shape - Shape instance
   */
  static drawCanvasText(ctx, shape) {
    const bounds = shape.getBounds();

    ctx.save();

    // Text style
    ctx.fillStyle = shape.textStyle.color;
    ctx.font = `${shape.textStyle.fontWeight} ${shape.textStyle.fontSize}px ${shape.textStyle.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw text
    ctx.fillText(shape.label, bounds.centerX, bounds.centerY);

    ctx.restore();
  }

  /**
   * Draw ports on canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {BaseShape} shape - Shape instance
   */
  static drawCanvasPorts(ctx, shape) {
    const ports = shape.getPortPositions();

    ports.forEach((port) => {
      ctx.save();

      // Port circle
      ctx.beginPath();
      ctx.arc(port.x, port.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#2196f3";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    });
  }

  /**
   * Draw handles on canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {BaseShape} shape - Shape instance
   */
  static drawCanvasHandles(ctx, shape) {
    const handles = shape.getHandlePositions();

    handles.forEach((handle) => {
      ctx.save();

      // Handle rectangle
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#2196f3";
      ctx.lineWidth = 2;
      ctx.fillRect(handle.x - 4, handle.y - 4, 8, 8);
      ctx.strokeRect(handle.x - 4, handle.y - 4, 8, 8);

      ctx.restore();
    });
  }

  /**
   * Draw selection box around shape
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {BaseShape} shape - Shape instance
   * @param {Object} style - Selection style
   */
  static drawSelectionBox(ctx, shape, style = {}) {
    const bounds = shape.getBounds();
    const {
      stroke = "#2196f3",
      strokeWidth = 2,
      dashPattern = [5, 5],
      padding = 2,
    } = style;

    ctx.save();

    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.setLineDash(dashPattern);

    ctx.strokeRect(
      bounds.x - padding,
      bounds.y - padding,
      bounds.width + padding * 2,
      bounds.height + padding * 2
    );

    ctx.restore();
  }

  /**
   * Create SVG element helper
   * @param {string} type - Element type
   * @param {Object} attributes - Attributes to set
   * @returns {SVGElement}
   */
  static createSVGElement(type, attributes = {}) {
    const element = document.createElementNS(ShapeRenderer.SVG_NS, type);

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });

    return element;
  }

  /**
   * Apply CSS class to SVG element
   * @param {SVGElement} element - SVG element
   * @param {string|Array} classes - Class name(s)
   */
  static addSVGClass(element, classes) {
    const classList = Array.isArray(classes) ? classes : [classes];
    const existing = element.getAttribute("class") || "";
    const newClasses = existing
      ? `${existing} ${classList.join(" ")}`
      : classList.join(" ");
    element.setAttribute("class", newClasses);
  }

  /**
   * Get shape as data URL (PNG)
   * @param {BaseShape} shape - Shape to export
   * @param {Object} options - Export options
   * @returns {string} - Data URL
   */
  static toDataURL(shape, options = {}) {
    const {
      scale = 2,
      backgroundColor = "transparent",
      padding = 10,
    } = options;

    // Create temporary SVG
    const svg = ShapeRenderer.createSVGElement("svg");
    const bounds = shape.getBounds();

    const width = (bounds.width + padding * 2) * scale;
    const height = (bounds.height + padding * 2) * scale;

    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute(
      "viewBox",
      `${bounds.x - padding} ${bounds.y - padding} ${
        bounds.width + padding * 2
      } ${bounds.height + padding * 2}`
    );

    // Background
    if (backgroundColor !== "transparent") {
      const bg = ShapeRenderer.createSVGElement("rect", {
        x: bounds.x - padding,
        y: bounds.y - padding,
        width: bounds.width + padding * 2,
        height: bounds.height + padding * 2,
        fill: backgroundColor,
      });
      svg.appendChild(bg);
    }

    // Add shape
    const shapeGroup = ShapeRenderer.renderComplete(shape, { showText: true });
    svg.appendChild(shapeGroup);

    // Convert to data URL
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    // Create canvas and draw
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
    };
    img.src = url;

    return canvas.toDataURL("image/png");
  }

  /**
   * Measure text dimensions
   * @param {string} text - Text to measure
   * @param {Object} textStyle - Text style
   * @returns {Object} - {width, height}
   */
  static measureText(text, textStyle = {}) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    ctx.font = `${textStyle.fontWeight || "normal"} ${
      textStyle.fontSize || 14
    }px ${textStyle.fontFamily || "Arial"}`;

    const metrics = ctx.measureText(text);

    return {
      width: metrics.width,
      height: textStyle.fontSize || 14,
    };
  }
}
