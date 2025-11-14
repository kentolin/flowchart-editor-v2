/**
 * PathGenerator.js - SVG path generation utilities
 *
 * Provides methods for generating SVG path strings for common shapes
 * and path operations like rounding corners, creating arrows, etc.
 *
 * @module shapes/helpers/PathGenerator
 */

export class PathGenerator {
  /**
   * Generate rectangle path
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @returns {string} - SVG path string
   */
  static rectangle(x, y, width, height) {
    return `M${x},${y} L${x + width},${y} L${x + width},${y + height} L${x},${
      y + height
    } Z`;
  }

  /**
   * Generate rounded rectangle path
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {number} radius - Corner radius
   * @returns {string} - SVG path string
   */
  static roundedRectangle(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);

    return `
      M${x + r},${y}
      L${x + width - r},${y}
      Q${x + width},${y} ${x + width},${y + r}
      L${x + width},${y + height - r}
      Q${x + width},${y + height} ${x + width - r},${y + height}
      L${x + r},${y + height}
      Q${x},${y + height} ${x},${y + height - r}
      L${x},${y + r}
      Q${x},${y} ${x + r},${y}
      Z
    `
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Generate circle path
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {number} radius - Radius
   * @returns {string} - SVG path string
   */
  static circle(cx, cy, radius) {
    return `
      M${cx - radius},${cy}
      A${radius},${radius} 0 1,0 ${cx + radius},${cy}
      A${radius},${radius} 0 1,0 ${cx - radius},${cy}
      Z
    `
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Generate ellipse path
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {number} rx - X radius
   * @param {number} ry - Y radius
   * @returns {string} - SVG path string
   */
  static ellipse(cx, cy, rx, ry) {
    return `
      M${cx - rx},${cy}
      A${rx},${ry} 0 1,0 ${cx + rx},${cy}
      A${rx},${ry} 0 1,0 ${cx - rx},${cy}
      Z
    `
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Generate diamond path
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @returns {string} - SVG path string
   */
  static diamond(x, y, width, height) {
    const cx = x + width / 2;
    const cy = y + height / 2;

    return `
      M${cx},${y}
      L${x + width},${cy}
      L${cx},${y + height}
      L${x},${cy}
      Z
    `
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Generate triangle path
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {string} direction - 'up', 'down', 'left', 'right'
   * @returns {string} - SVG path string
   */
  static triangle(x, y, width, height, direction = "up") {
    const cx = x + width / 2;
    const cy = y + height / 2;

    switch (direction) {
      case "up":
        return `M${cx},${y} L${x + width},${y + height} L${x},${y + height} Z`;
      case "down":
        return `M${x},${y} L${x + width},${y} L${cx},${y + height} Z`;
      case "left":
        return `M${x},${cy} L${x + width},${y} L${x + width},${y + height} Z`;
      case "right":
        return `M${x},${y} L${x + width},${cy} L${x},${y + height} Z`;
      default:
        return `M${cx},${y} L${x + width},${y + height} L${x},${y + height} Z`;
    }
  }

  /**
   * Generate polygon path
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {number} radius - Radius
   * @param {number} sides - Number of sides
   * @param {number} rotation - Rotation in degrees
   * @returns {string} - SVG path string
   */
  static polygon(cx, cy, radius, sides, rotation = 0) {
    const points = [];
    const angleStep = (Math.PI * 2) / sides;
    const startAngle = (rotation * Math.PI) / 180;

    for (let i = 0; i < sides; i++) {
      const angle = startAngle + i * angleStep;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    }

    return `M${points.join(" L")} Z`;
  }

  /**
   * Generate star path
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {number} outerRadius - Outer radius
   * @param {number} innerRadius - Inner radius
   * @param {number} points - Number of points
   * @param {number} rotation - Rotation in degrees
   * @returns {string} - SVG path string
   */
  static star(cx, cy, outerRadius, innerRadius, points, rotation = 0) {
    const vertices = [];
    const angleStep = Math.PI / points;
    const startAngle = (rotation * Math.PI) / 180;

    for (let i = 0; i < points * 2; i++) {
      const angle = startAngle + i * angleStep;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      vertices.push(`${x},${y}`);
    }

    return `M${vertices.join(" L")} Z`;
  }

  /**
   * Generate parallelogram path (for data shape)
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {number} skew - Skew amount
   * @returns {string} - SVG path string
   */
  static parallelogram(x, y, width, height, skew = 20) {
    return `
      M${x + skew},${y}
      L${x + width},${y}
      L${x + width - skew},${y + height}
      L${x},${y + height}
      Z
    `
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Generate trapezoid path
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {number} topOffset - Top width offset
   * @returns {string} - SVG path string
   */
  static trapezoid(x, y, width, height, topOffset = 20) {
    return `
      M${x + topOffset},${y}
      L${x + width - topOffset},${y}
      L${x + width},${y + height}
      L${x},${y + height}
      Z
    `
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Generate hexagon path
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {number} radius - Radius
   * @returns {string} - SVG path string
   */
  static hexagon(cx, cy, radius) {
    return PathGenerator.polygon(cx, cy, radius, 6, 30);
  }

  /**
   * Generate arrow path
   * @param {number} x - Start X
   * @param {number} y - Start Y
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {number} headWidth - Arrow head width
   * @param {string} direction - 'right', 'left', 'up', 'down'
   * @returns {string} - SVG path string
   */
  static arrow(x, y, width, height, headWidth = 20, direction = "right") {
    const bodyHeight = height / 3;
    const cy = y + height / 2;

    switch (direction) {
      case "right":
        return `
          M${x},${cy - bodyHeight / 2}
          L${x + width - headWidth},${cy - bodyHeight / 2}
          L${x + width - headWidth},${y}
          L${x + width},${cy}
          L${x + width - headWidth},${y + height}
          L${x + width - headWidth},${cy + bodyHeight / 2}
          L${x},${cy + bodyHeight / 2}
          Z
        `
          .replace(/\s+/g, " ")
          .trim();
      case "left":
        return `
          M${x + headWidth},${cy - bodyHeight / 2}
          L${x + width},${cy - bodyHeight / 2}
          L${x + width},${cy + bodyHeight / 2}
          L${x + headWidth},${cy + bodyHeight / 2}
          L${x + headWidth},${y + height}
          L${x},${cy}
          L${x + headWidth},${y}
          Z
        `
          .replace(/\s+/g, " ")
          .trim();
      default:
        return PathGenerator.arrow(x, y, width, height, headWidth, "right");
    }
  }

  /**
   * Generate document shape path (rectangle with wavy bottom)
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {number} waveHeight - Wave height
   * @returns {string} - SVG path string
   */
  static document(x, y, width, height, waveHeight = 10) {
    const waveCount = 3;
    const waveWidth = width / waveCount;

    let path = `M${x},${y} L${x + width},${y} L${x + width},${
      y + height - waveHeight
    }`;

    // Create waves at bottom
    for (let i = waveCount; i > 0; i--) {
      const x1 = x + i * waveWidth;
      const x2 = x + (i - 0.5) * waveWidth;
      const x3 = x + (i - 1) * waveWidth;
      path += ` Q${x1},${y + height} ${x2},${y + height - waveHeight} Q${x2},${
        y + height - waveHeight
      } ${x3},${y + height}`;
    }

    path += ` L${x},${y + height - waveHeight} Z`;

    return path.replace(/\s+/g, " ").trim();
  }

  /**
   * Generate cylinder path (for database symbol)
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {number} topHeight - Top ellipse height
   * @returns {string} - SVG path string
   */
  static cylinder(x, y, width, height, topHeight = 10) {
    const rx = width / 2;
    const ry = topHeight;
    const cx = x + rx;

    return `
      M${x},${y + ry}
      A${rx},${ry} 0 0,1 ${x + width},${y + ry}
      L${x + width},${y + height - ry}
      A${rx},${ry} 0 0,1 ${x},${y + height - ry}
      L${x},${y + ry}
      M${x},${y + ry}
      A${rx},${ry} 0 0,0 ${x + width},${y + ry}
    `
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Generate cloud path
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @returns {string} - SVG path string
   */
  static cloud(x, y, width, height) {
    const cx = x + width / 2;
    const cy = y + height / 2;

    // Simplified cloud using circles
    const r1 = height * 0.3;
    const r2 = height * 0.4;
    const r3 = height * 0.35;
    const r4 = height * 0.3;

    return `
      M${x + r1},${cy + r1}
      A${r1},${r1} 0 0,1 ${x + r1},${cy - r1}
      A${r2},${r2} 0 0,1 ${cx},${y + r2}
      A${r2},${r2} 0 0,1 ${x + width - r3},${cy - r3}
      A${r3},${r3} 0 0,1 ${x + width - r4},${cy + r4}
      A${r4},${r4} 0 0,1 ${x + r1},${cy + r1}
      Z
    `
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Generate bezier curve path
   * @param {number} x1 - Start X
   * @param {number} y1 - Start Y
   * @param {number} x2 - End X
   * @param {number} y2 - End Y
   * @param {number} curvature - Curve amount (0-1)
   * @returns {string} - SVG path string
   */
  static bezierCurve(x1, y1, x2, y2, curvature = 0.3) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const offset = distance * curvature;

    const cx1 = x1 + offset;
    const cy1 = y1;
    const cx2 = x2 - offset;
    const cy2 = y2;

    return `M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`;
  }

  /**
   * Generate smooth path through points
   * @param {Array} points - Array of {x, y} points
   * @param {boolean} closed - Whether to close the path
   * @returns {string} - SVG path string
   */
  static smoothPath(points, closed = false) {
    if (points.length < 2) return "";

    let path = `M${points[0].x},${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1] || points[i];

      const cx1 = prev.x + (curr.x - prev.x) / 3;
      const cy1 = prev.y + (curr.y - prev.y) / 3;
      const cx2 = curr.x - (next.x - curr.x) / 3;
      const cy2 = curr.y - (next.y - curr.y) / 3;

      path += ` C${cx1},${cy1} ${cx2},${cy2} ${curr.x},${curr.y}`;
    }

    if (closed) {
      path += " Z";
    }

    return path;
  }

  /**
   * Create Path2D object from path string
   * @param {string} pathString - SVG path string
   * @returns {Path2D}
   */
  static toPath2D(pathString) {
    return new Path2D(pathString);
  }

  /**
   * Parse path string to commands
   * @param {string} pathString - SVG path string
   * @returns {Array} - Array of path commands
   */
  static parsePathString(pathString) {
    const commands = [];
    const regex = /([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi;
    let match;

    while ((match = regex.exec(pathString)) !== null) {
      const command = match[1];
      const params = match[2]
        .trim()
        .split(/[\s,]+/)
        .map(parseFloat)
        .filter((n) => !isNaN(n));
      commands.push({ command, params });
    }

    return commands;
  }

  /**
   * Get path bounds
   * @param {string} pathString - SVG path string
   * @returns {Object} - {x, y, width, height}
   */
  static getPathBounds(pathString) {
    // Create temporary SVG to measure path
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathString);
    svg.appendChild(path);
    document.body.appendChild(svg);

    const bbox = path.getBBox();
    document.body.removeChild(svg);

    return {
      x: bbox.x,
      y: bbox.y,
      width: bbox.width,
      height: bbox.height,
    };
  }
}
