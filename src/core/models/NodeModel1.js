/**
 * NodeModel.js - Data Models for Diagram Elements
 *
 * Pure data structures representing nodes.
 * No rendering, no events, no dependencies - just data!
 *
 * Contains:
 * - NodeModel: Single node/shape in the diagram
 *
 * NO DEPENDENCIES - Foundation layer!
 *
 * @module core/models/NodeModel
 * @version 1.0.0
 *
 * @example
 * const node = new NodeModel({
 *   id: 'node_1',
 *   type: 'rect',
 *   x: 100,
 *   y: 100,
 *   label: 'Process'
 * });
 */

/**
 * NodeModel Class
 *
 * Represents a single node/shape in the diagram.
 * Contains all data about the node.
 *
 * Pure data structure - no rendering or event logic.
 */
class NodeModel {
  /**
   * Create a new node
   *
   * @param {Object} data - Node data
   * @param {string} data.id - Unique node identifier
   * @param {string} data.type - Shape type ('rect', 'circle', 'diamond', etc.)
   * @param {number} data.x - X coordinate (left position)
   * @param {number} data.y - Y coordinate (top position)
   * @param {number} [data.width=120] - Node width in pixels
   * @param {number} [data.height=60] - Node height in pixels
   * @param {string} [data.label=''] - Display text for the node
   * @param {Object} [data.style={}] - CSS-like styling (fill, stroke, etc.)
   * @param {Array} [data.ports=[]] - Connection ports for edges
   * @param {Object} [data.metadata={}] - Custom data attached to node
   *
   * @throws {Error} If required fields are missing or invalid
   *
   * @example
   * // Minimal node
   * const node = new NodeModel({
   *   id: 'n1',
   *   type: 'rect',
   *   x: 100,
   *   y: 100
   * });
   *
   * // Complete node
   * const node = new NodeModel({
   *   id: 'n1',
   *   type: 'rect',
   *   x: 100,
   *   y: 100,
   *   width: 140,
   *   height: 80,
   *   label: 'Process',
   *   style: { fill: '#90EE90', stroke: '#228B22' },
   *   ports: [
   *     { id: 'top', position: 'top' },
   *     { id: 'right', position: 'right' }
   *   ]
   * });
   */
  constructor(data) {
    // Validate required fields
    if (!data || typeof data !== "object") {
      throw new Error("NodeModel: data must be an object");
    }
    if (!data.id) throw new Error("NodeModel: id is required");
    if (!data.type) throw new Error("NodeModel: type is required");
    if (typeof data.x !== "number")
      throw new Error("NodeModel: x must be a number");
    if (typeof data.y !== "number")
      throw new Error("NodeModel: y must be a number");

    // Core properties
    this.id = data.id;
    this.type = data.type;
    this.x = data.x;
    this.y = data.y;
    this.width = data.width !== undefined ? data.width : 120;
    this.height = data.height !== undefined ? data.height : 60;

    // Display properties
    this.label = data.label || "";

    // Style properties
    this.style = data.style || {
      fill: "#ffffff",
      stroke: "#000000",
      strokeWidth: 2,
    };

    // Connection ports
    this.ports = data.ports || [
      { id: "top", position: "top" },
      { id: "right", position: "right" },
      { id: "bottom", position: "bottom" },
      { id: "left", position: "left" },
    ];

    // Custom data
    this.metadata = data.metadata || {};

    // Timestamps
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Get the bounding box of this node
   *
   * Used for collision detection, selection, queries.
   * Returns rectangle that contains the node.
   *
   * @returns {Object} Bounding box
   * @returns {number} bounds.x - Left edge
   * @returns {number} bounds.y - Top edge
   * @returns {number} bounds.x2 - Right edge
   * @returns {number} bounds.y2 - Bottom edge
   * @returns {number} bounds.width - Width
   * @returns {number} bounds.height - Height
   * @returns {number} bounds.centerX - Center X
   * @returns {number} bounds.centerY - Center Y
   *
   * @example
   * const bounds = node.getBounds();
   * console.log(`Node at (${bounds.x}, ${bounds.y})`);
   * console.log(`Size: ${bounds.width}x${bounds.height}`);
   * console.log(`Center: (${bounds.centerX}, ${bounds.centerY})`);
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      x2: this.x + this.width,
      y2: this.y + this.height,
      width: this.width,
      height: this.height,
      centerX: this.x + this.width / 2,
      centerY: this.y + this.height / 2,
    };
  }

  /**
   * Check if a point is inside this node
   *
   * Used for hit detection (clicking on nodes).
   * Point is inside if within bounding box.
   *
   * @param {number} px - Point X coordinate
   * @param {number} py - Point Y coordinate
   *
   * @returns {boolean} True if point is inside node
   *
   * @example
   * if (node.contains(mouseX, mouseY)) {
   *   console.log('User clicked on this node');
   * }
   */
  contains(px, py) {
    return (
      px >= this.x &&
      px <= this.x + this.width &&
      py >= this.y &&
      py <= this.y + this.height
    );
  }

  /**
   * Check if this node intersects with another node
   *
   * Used for collision detection.
   * Uses AABB (Axis-Aligned Bounding Box) algorithm.
   *
   * @param {NodeModel} other - Another node to check against
   *
   * @returns {boolean} True if nodes overlap
   *
   * @example
   * if (node1.intersects(node2)) {
   *   console.log('Nodes are overlapping');
   * }
   */
  intersects(other) {
    const bounds = this.getBounds();
    const otherBounds = other.getBounds();

    // AABB collision: no collision if boxes don't overlap
    return !(
      (
        bounds.x2 < otherBounds.x || // This is left of other
        bounds.y2 < otherBounds.y || // This is above other
        bounds.x > otherBounds.x2 || // This is right of other
        bounds.y > otherBounds.y2
      ) // This is below other
    );
  }

  /**
   * Get a connection point for edges
   *
   * Returns the point where edges should connect to this node.
   * Useful for calculating edge paths.
   *
   * @param {string} [direction='center'] - Connection direction
   *                                         'top', 'bottom', 'left', 'right', 'center'
   *
   * @returns {Object} Connection point { x, y }
   *
   * @example
   * const topPoint = node.getConnectionPoint('top');
   * const rightPoint = node.getConnectionPoint('right');
   * const center = node.getConnectionPoint('center');
   *
   * // Use for edge routing
   * drawLine(sourceNode.getConnectionPoint('right'),
   *          targetNode.getConnectionPoint('left'));
   */
  getConnectionPoint(direction = "center") {
    const bounds = this.getBounds();

    switch (direction) {
      case "top":
        return { x: bounds.centerX, y: bounds.y };
      case "bottom":
        return { x: bounds.centerX, y: bounds.y2 };
      case "left":
        return { x: bounds.x, y: bounds.centerY };
      case "right":
        return { x: bounds.x2, y: bounds.centerY };
      case "center":
      default:
        return { x: bounds.centerX, y: bounds.centerY };
    }
  }

  /**
   * Update node properties
   *
   * Modify node data and update timestamp.
   *
   * @param {Object} updates - Properties to update
   *
   * @example
   * node.update({ x: 200, y: 150, label: 'New Label' });
   * node.update({ style: { fill: '#FF0000' } });
   */
  update(updates) {
    if (updates && typeof updates === "object") {
      Object.assign(this, updates);
      this.updatedAt = new Date();
    }
  }

  /**
   * Create a deep copy of this node
   *
   * Useful for undo/redo or clipboard operations.
   * Returned node has same properties but is separate instance.
   *
   * @returns {NodeModel} Deep copy of this node
   *
   * @example
   * const copy = node.clone();
   * copy.id = 'node_2';  // Give it new ID
   * copy.x = 250;        // Move it
   */
  clone() {
    return new NodeModel({
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      label: this.label,
      style: { ...this.style },
      ports: this.ports.map((p) => ({ ...p })),
      metadata: { ...this.metadata },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }

  /**
   * Convert node to plain object
   *
   * For JSON serialization (saving to file/database).
   *
   * @returns {Object} Plain object representation
   *
   * @example
   * const json = node.toJSON();
   * const jsonString = JSON.stringify(json);
   * localStorage.setItem('node', jsonString);
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      label: this.label,
      style: this.style,
      ports: this.ports,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Create node from JSON
   *
   * For deserialization (loading from file/database).
   *
   * @param {Object} json - Plain object from JSON
   *
   * @returns {NodeModel} New node instance
   *
   * @example
   * const json = JSON.parse(jsonString);
   * const node = NodeModel.fromJSON(json);
   */
  static fromJSON(json) {
    return new NodeModel(json);
  }

  /**
   * Check equality with another node
   *
   * Compares key properties (not timestamps or metadata).
   *
   * @param {NodeModel} other - Another node
   *
   * @returns {boolean} True if nodes have same core properties
   *
   * @example
   * if (node1.equals(node2)) {
   *   console.log('Nodes have same properties');
   * }
   */
  equals(other) {
    return (
      this.id === other.id &&
      this.type === other.type &&
      this.x === other.x &&
      this.y === other.y &&
      this.width === other.width &&
      this.height === other.height &&
      this.label === other.label
    );
  }
}

export { NodeModel };
