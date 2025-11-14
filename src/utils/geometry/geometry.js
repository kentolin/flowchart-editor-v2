/**
 * geometry.js - Geometric calculation utilities
 */

export class GeometryUtils {
  /**
   * Calculate distance between two points
   */
  static distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate angle between two points (in radians)
   */
  static angle(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }

  /**
   * Calculate angle in degrees
   */
  static angleDegrees(p1, p2) {
    return (this.angle(p1, p2) * 180) / Math.PI;
  }

  /**
   * Check if point is inside rectangle
   */
  static pointInRect(point, rect) {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }

  /**
   * Check if point is inside circle
   */
  static pointInCircle(point, center, radius) {
    return this.distance(point, center) <= radius;
  }

  /**
   * Check if two rectangles intersect
   */
  static rectsIntersect(rect1, rect2) {
    return !(
      rect1.x + rect1.width < rect2.x ||
      rect2.x + rect2.width < rect1.x ||
      rect1.y + rect1.height < rect2.y ||
      rect2.y + rect2.height < rect1.y
    );
  }

  /**
   * Calculate bounding box for multiple points
   */
  static boundingBox(points) {
    if (points.length === 0) return null;

    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    points.forEach((p) => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Calculate center point of rectangle
   */
  static rectCenter(rect) {
    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
    };
  }

  /**
   * Rotate point around center
   */
  static rotatePoint(point, center, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = point.x - center.x;
    const dy = point.y - center.y;

    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos,
    };
  }

  /**
   * Calculate line intersection point
   */
  static lineIntersection(line1Start, line1End, line2Start, line2End) {
    const x1 = line1Start.x,
      y1 = line1Start.y;
    const x2 = line1End.x,
      y2 = line1End.y;
    const x3 = line2Start.x,
      y3 = line2Start.y;
    const x4 = line2End.x,
      y4 = line2End.y;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) return null; // Parallel lines

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1),
      };
    }

    return null;
  }

  /**
   * Calculate closest point on line segment to a point
   */
  static closestPointOnLine(point, lineStart, lineEnd) {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) return { ...lineStart };

    let t =
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
      lengthSquared;
    t = Math.max(0, Math.min(1, t));

    return {
      x: lineStart.x + t * dx,
      y: lineStart.y + t * dy,
    };
  }

  /**
   * Calculate distance from point to line segment
   */
  static pointToLineDistance(point, lineStart, lineEnd) {
    const closest = this.closestPointOnLine(point, lineStart, lineEnd);
    return this.distance(point, closest);
  }

  /**
   * Scale rectangle from center
   */
  static scaleRect(rect, scale) {
    const center = this.rectCenter(rect);
    const newWidth = rect.width * scale;
    const newHeight = rect.height * scale;

    return {
      x: center.x - newWidth / 2,
      y: center.y - newHeight / 2,
      width: newWidth,
      height: newHeight,
    };
  }

  /**
   * Snap value to grid
   */
  static snapToGrid(value, gridSize) {
    return Math.round(value / gridSize) * gridSize;
  }

  /**
   * Snap point to grid
   */
  static snapPointToGrid(point, gridSize) {
    return {
      x: this.snapToGrid(point.x, gridSize),
      y: this.snapToGrid(point.y, gridSize),
    };
  }

  /**
   * Calculate bezier curve point at t (0-1)
   */
  static bezierPoint(t, p0, p1, p2, p3) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    return {
      x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
      y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
    };
  }

  /**
   * Calculate quadratic bezier curve point at t (0-1)
   */
  static quadraticBezierPoint(t, p0, p1, p2) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;

    return {
      x: mt2 * p0.x + 2 * mt * t * p1.x + t2 * p2.x,
      y: mt2 * p0.y + 2 * mt * t * p1.y + t2 * p2.y,
    };
  }

  /**
   * Clamp value between min and max
   */
  static clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Linear interpolation between two values
   */
  static lerp(start, end, t) {
    return start + (end - start) * t;
  }

  /**
   * Linear interpolation between two points
   */
  static lerpPoint(p1, p2, t) {
    return {
      x: this.lerp(p1.x, p2.x, t),
      y: this.lerp(p1.y, p2.y, t),
    };
  }

  /**
   * Calculate polygon area
   */
  static polygonArea(points) {
    let area = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }

    return Math.abs(area) / 2;
  }

  /**
   * Check if point is inside polygon
   */
  static pointInPolygon(point, polygon) {
    let inside = false;
    const n = polygon.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygon[i].x,
        yi = polygon[i].y;
      const xj = polygon[j].x,
        yj = polygon[j].y;

      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * Calculate intersection point between line and rectangle
   */
  static lineRectIntersection(lineStart, lineEnd, rect) {
    const corners = [
      { x: rect.x, y: rect.y },
      { x: rect.x + rect.width, y: rect.y },
      { x: rect.x + rect.width, y: rect.y + rect.height },
      { x: rect.x, y: rect.y + rect.height },
    ];

    const edges = [
      [corners[0], corners[1]],
      [corners[1], corners[2]],
      [corners[2], corners[3]],
      [corners[3], corners[0]],
    ];

    for (const [edgeStart, edgeEnd] of edges) {
      const intersection = this.lineIntersection(
        lineStart,
        lineEnd,
        edgeStart,
        edgeEnd
      );
      if (intersection) return intersection;
    }

    return null;
  }

  /**
   * Normalize vector
   */
  static normalize(vector) {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (length === 0) return { x: 0, y: 0 };
    return {
      x: vector.x / length,
      y: vector.y / length,
    };
  }

  /**
   * Calculate dot product
   */
  static dotProduct(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
  }

  /**
   * Calculate cross product (2D)
   */
  static crossProduct(v1, v2) {
    return v1.x * v2.y - v1.y * v2.x;
  }
}
