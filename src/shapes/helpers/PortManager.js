/**
 * PortManager.js - Port management utilities
 *
 * Provides utilities for managing shape connection ports including
 * port positioning, collision detection, and connection logic.
 *
 * @module shapes/helpers/PortManager
 */

export class PortManager {
  /**
   * Calculate absolute port positions for a shape
   * @param {BaseShape} shape - Shape instance
   * @returns {Array} - Array of {id, x, y, type, direction}
   */
  static getPortPositions(shape) {
    if (!shape.portsEnabled || shape.ports.length === 0) {
      return [];
    }

    const bounds = shape.getBounds();

    return shape.ports.map((port) => ({
      id: port.id,
      x: bounds.x + bounds.width * port.x,
      y: bounds.y + bounds.height * port.y,
      type: port.type || "both",
      direction: port.direction || "any",
      relativeX: port.x,
      relativeY: port.y,
    }));
  }

  /**
   * Get port by ID
   * @param {BaseShape} shape - Shape instance
   * @param {string} portId - Port identifier
   * @returns {Object|null} - Port object or null
   */
  static getPortById(shape, portId) {
    const ports = PortManager.getPortPositions(shape);
    return ports.find((p) => p.id === portId) || null;
  }

  /**
   * Find nearest port to a point
   * @param {BaseShape} shape - Shape instance
   * @param {Object} point - {x, y}
   * @param {number} maxDistance - Maximum distance to search
   * @returns {Object|null} - Port object with distance, or null
   */
  static findNearestPort(shape, point, maxDistance = 20) {
    const ports = PortManager.getPortPositions(shape);

    let nearest = null;
    let minDistance = maxDistance;

    ports.forEach((port) => {
      const distance = PortManager.distanceToPoint(port, point);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = { ...port, distance };
      }
    });

    return nearest;
  }

  /**
   * Calculate distance from port to point
   * @param {Object} port - Port object
   * @param {Object} point - {x, y}
   * @returns {number} - Distance
   */
  static distanceToPoint(port, point) {
    const dx = port.x - point.x;
    const dy = port.y - point.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if port accepts input connections
   * @param {Object} port - Port object
   * @returns {boolean}
   */
  static isInputPort(port) {
    return port.type === "input" || port.type === "both";
  }

  /**
   * Check if port accepts output connections
   * @param {Object} port - Port object
   * @returns {boolean}
   */
  static isOutputPort(port) {
    return port.type === "output" || port.type === "both";
  }

  /**
   * Check if two ports can be connected
   * @param {Object} sourcePort - Source port
   * @param {Object} targetPort - Target port
   * @returns {boolean}
   */
  static canConnect(sourcePort, targetPort) {
    // Output port must be able to output
    if (!PortManager.isOutputPort(sourcePort)) {
      return false;
    }

    // Input port must be able to input
    if (!PortManager.isInputPort(targetPort)) {
      return false;
    }

    // Can't connect port to itself
    if (sourcePort.id === targetPort.id) {
      return false;
    }

    return true;
  }

  /**
   * Calculate connection angle from port direction
   * @param {Object} port - Port object
   * @returns {number} - Angle in degrees
   */
  static getPortAngle(port) {
    const directions = {
      top: 270,
      "top-right": 315,
      right: 0,
      "bottom-right": 45,
      bottom: 90,
      "bottom-left": 135,
      left: 180,
      "top-left": 225,
      any: 0,
    };

    return directions[port.direction] || 0;
  }

  /**
   * Calculate optimal port for connecting to another shape
   * @param {BaseShape} shape - Shape to connect from
   * @param {BaseShape} targetShape - Shape to connect to
   * @param {string} portType - 'input' or 'output'
   * @returns {Object|null} - Best port or null
   */
  static getOptimalPort(shape, targetShape, portType = "output") {
    const ports = PortManager.getPortPositions(shape);
    const targetBounds = targetShape.getBounds();
    const targetCenter = { x: targetBounds.centerX, y: targetBounds.centerY };

    // Filter ports by type
    const validPorts = ports.filter((port) =>
      portType === "output"
        ? PortManager.isOutputPort(port)
        : PortManager.isInputPort(port)
    );

    if (validPorts.length === 0) return null;

    // Find port closest to target center
    let bestPort = validPorts[0];
    let minDistance = PortManager.distanceToPoint(bestPort, targetCenter);

    validPorts.forEach((port) => {
      const distance = PortManager.distanceToPoint(port, targetCenter);
      if (distance < minDistance) {
        minDistance = distance;
        bestPort = port;
      }
    });

    return bestPort;
  }

  /**
   * Get port side (top, right, bottom, left)
   * @param {Object} port - Port object
   * @returns {string} - 'top', 'right', 'bottom', 'left'
   */
  static getPortSide(port) {
    // Based on relative position
    const { relativeX, relativeY } = port;

    if (relativeX === 0) return "left";
    if (relativeX === 1) return "right";
    if (relativeY === 0) return "top";
    if (relativeY === 1) return "bottom";

    // Corner or middle - determine by which is more extreme
    const dx = Math.abs(relativeX - 0.5);
    const dy = Math.abs(relativeY - 0.5);

    if (dx > dy) {
      return relativeX < 0.5 ? "left" : "right";
    } else {
      return relativeY < 0.5 ? "top" : "bottom";
    }
  }

  /**
   * Create standard port configurations
   * @param {string} preset - Preset name
   * @returns {Array} - Array of port definitions
   */
  static createStandardPorts(preset = "standard-4") {
    const presets = {
      "standard-4": [
        { id: "top", x: 0.5, y: 0, type: "input", direction: "top" },
        { id: "right", x: 1, y: 0.5, type: "output", direction: "right" },
        { id: "bottom", x: 0.5, y: 1, type: "output", direction: "bottom" },
        { id: "left", x: 0, y: 0.5, type: "input", direction: "left" },
      ],
      "standard-8": [
        { id: "top", x: 0.5, y: 0, type: "both", direction: "top" },
        {
          id: "top-right",
          x: 0.75,
          y: 0,
          type: "both",
          direction: "top-right",
        },
        { id: "right", x: 1, y: 0.5, type: "both", direction: "right" },
        {
          id: "bottom-right",
          x: 0.75,
          y: 1,
          type: "both",
          direction: "bottom-right",
        },
        { id: "bottom", x: 0.5, y: 1, type: "both", direction: "bottom" },
        {
          id: "bottom-left",
          x: 0.25,
          y: 1,
          type: "both",
          direction: "bottom-left",
        },
        { id: "left", x: 0, y: 0.5, type: "both", direction: "left" },
        { id: "top-left", x: 0.25, y: 0, type: "both", direction: "top-left" },
      ],
      corners: [
        { id: "top-left", x: 0, y: 0, type: "both", direction: "top-left" },
        { id: "top-right", x: 1, y: 0, type: "both", direction: "top-right" },
        {
          id: "bottom-right",
          x: 1,
          y: 1,
          type: "both",
          direction: "bottom-right",
        },
        {
          id: "bottom-left",
          x: 0,
          y: 1,
          type: "both",
          direction: "bottom-left",
        },
      ],
      flowchart: [
        { id: "top", x: 0.5, y: 0, type: "input", direction: "top" },
        { id: "bottom", x: 0.5, y: 1, type: "output", direction: "bottom" },
      ],
      horizontal: [
        { id: "left", x: 0, y: 0.5, type: "input", direction: "left" },
        { id: "right", x: 1, y: 0.5, type: "output", direction: "right" },
      ],
    };

    return presets[preset] || presets["standard-4"];
  }

  /**
   * Highlight port (add visual indicator)
   * @param {SVGElement} portElement - Port SVG element
   * @param {string} color - Highlight color
   */
  static highlightPort(portElement, color = "#00ff00") {
    portElement.setAttribute(
      "data-original-fill",
      portElement.getAttribute("fill")
    );
    portElement.setAttribute("fill", color);
    portElement.setAttribute("r", 6); // Make slightly larger
  }

  /**
   * Remove port highlight
   * @param {SVGElement} portElement - Port SVG element
   */
  static unhighlightPort(portElement) {
    const originalFill = portElement.getAttribute("data-original-fill");
    if (originalFill) {
      portElement.setAttribute("fill", originalFill);
    }
    portElement.setAttribute("r", 4); // Reset size
  }

  /**
   * Check if point is near any port
   * @param {BaseShape} shape - Shape instance
   * @param {Object} point - {x, y}
   * @param {number} threshold - Distance threshold
   * @returns {boolean}
   */
  static isNearPort(shape, point, threshold = 10) {
    const nearest = PortManager.findNearestPort(shape, point, threshold);
    return nearest !== null;
  }

  /**
   * Get all input ports
   * @param {BaseShape} shape - Shape instance
   * @returns {Array} - Array of input ports
   */
  static getInputPorts(shape) {
    const ports = PortManager.getPortPositions(shape);
    return ports.filter((port) => PortManager.isInputPort(port));
  }

  /**
   * Get all output ports
   * @param {BaseShape} shape - Shape instance
   * @returns {Array} - Array of output ports
   */
  static getOutputPorts(shape) {
    const ports = PortManager.getPortPositions(shape);
    return ports.filter((port) => PortManager.isOutputPort(port));
  }

  /**
   * Calculate connection path from port to port
   * @param {Object} sourcePort - Source port
   * @param {Object} targetPort - Target port
   * @param {string} style - Connection style ('straight', 'bezier', 'orthogonal')
   * @returns {string} - SVG path string
   */
  static calculateConnectionPath(sourcePort, targetPort, style = "bezier") {
    switch (style) {
      case "straight":
        return PortManager._straightPath(sourcePort, targetPort);
      case "bezier":
        return PortManager._bezierPath(sourcePort, targetPort);
      case "orthogonal":
        return PortManager._orthogonalPath(sourcePort, targetPort);
      default:
        return PortManager._bezierPath(sourcePort, targetPort);
    }
  }

  /**
   * Generate straight connection path
   * @private
   */
  static _straightPath(sourcePort, targetPort) {
    return `M${sourcePort.x},${sourcePort.y} L${targetPort.x},${targetPort.y}`;
  }

  /**
   * Generate bezier connection path
   * @private
   */
  static _bezierPath(sourcePort, targetPort) {
    const dx = targetPort.x - sourcePort.x;
    const dy = targetPort.y - sourcePort.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const offset = distance * 0.3;

    // Calculate control points based on port directions
    const sourceAngle = PortManager.getPortAngle(sourcePort);
    const targetAngle = PortManager.getPortAngle(targetPort);

    const cp1x =
      sourcePort.x + offset * Math.cos((sourceAngle * Math.PI) / 180);
    const cp1y =
      sourcePort.y + offset * Math.sin((sourceAngle * Math.PI) / 180);
    const cp2x =
      targetPort.x + offset * Math.cos((targetAngle * Math.PI) / 180);
    const cp2y =
      targetPort.y + offset * Math.sin((targetAngle * Math.PI) / 180);

    return `M${sourcePort.x},${sourcePort.y} C${cp1x},${cp1y} ${cp2x},${cp2y} ${targetPort.x},${targetPort.y}`;
  }

  /**
   * Generate orthogonal connection path
   * @private
   */
  static _orthogonalPath(sourcePort, targetPort) {
    const midX = (sourcePort.x + targetPort.x) / 2;
    const midY = (sourcePort.y + targetPort.y) / 2;

    const sourceSide = PortManager.getPortSide(sourcePort);
    const targetSide = PortManager.getPortSide(targetPort);

    // Simple orthogonal routing
    if (sourceSide === "right" && targetSide === "left") {
      return `M${sourcePort.x},${sourcePort.y} L${midX},${sourcePort.y} L${midX},${targetPort.y} L${targetPort.x},${targetPort.y}`;
    } else if (sourceSide === "bottom" && targetSide === "top") {
      return `M${sourcePort.x},${sourcePort.y} L${sourcePort.x},${midY} L${targetPort.x},${midY} L${targetPort.x},${targetPort.y}`;
    }

    // Default to simple bend
    return `M${sourcePort.x},${sourcePort.y} L${sourcePort.x},${targetPort.y} L${targetPort.x},${targetPort.y}`;
  }

  /**
   * Validate port configuration
   * @param {Array} ports - Array of port definitions
   * @returns {Object} - {valid: boolean, errors: Array}
   */
  static validatePorts(ports) {
    const errors = [];
    const ids = new Set();

    ports.forEach((port, index) => {
      // Check required fields
      if (!port.id) {
        errors.push(`Port ${index} missing id`);
      } else if (ids.has(port.id)) {
        errors.push(`Duplicate port id: ${port.id}`);
      } else {
        ids.add(port.id);
      }

      // Check position
      if (typeof port.x !== "number" || port.x < 0 || port.x > 1) {
        errors.push(`Port ${port.id || index} x must be between 0 and 1`);
      }
      if (typeof port.y !== "number" || port.y < 0 || port.y > 1) {
        errors.push(`Port ${port.id || index} y must be between 0 and 1`);
      }

      // Check type
      if (port.type && !["input", "output", "both"].includes(port.type)) {
        errors.push(`Port ${port.id} has invalid type: ${port.type}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
