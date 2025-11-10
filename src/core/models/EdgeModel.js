/**
 * EdgeModel.js - Data Models for Diagram Elements
 *
 * Pure data structures representing edges.
 * No rendering, no events, no dependencies - just data!
 *
 * Contains:
 * - EdgeModel: Connection between nodes
 *
 * NO DEPENDENCIES - Foundation layer!
 *
 * @module core/models/EdgeModel
 * @version 1.0.0
 *
 */

class EdgeModel {
  /**
   * Create a new edge
   *
   * @param {Object} data - Edge data
   * @param {string} data.id - Unique edge identifier
   * @param {string} data.sourceId - ID of the source node
   * @param {string} data.targetId - ID of the target node
   * @param {string} [data.type='straight'] - Routing type
   *                                           'straight', 'bezier', 'orthogonal'
   * @param {string} [data.label=''] - Display text for the edge
   * @param {Object} [data.style={}] - CSS-like styling
   * @param {Object} [data.metadata={}] - Custom data
   *
   * @throws {Error} If required fields are missing
   *
   * @example
   * // Minimal edge
   * const edge = new EdgeModel({
   *   id: 'e1',
   *   sourceId: 'node_1',
   *   targetId: 'node_2'
   * });
   *
   * // Complete edge
   * const edge = new EdgeModel({
   *   id: 'e1',
   *   sourceId: 'node_1',
   *   targetId: 'node_2',
   *   type: 'bezier',
   *   label: 'connects to',
   *   sourcePort: 'right',
   *   targetPort: 'left',
   *   style: { stroke: '#000000', strokeWidth: 2 }
   * });
   */
  constructor(data) {
    // Validate required fields
    if (!data || typeof data !== "object") {
      throw new Error("EdgeModel: data must be an object");
    }
    if (!data.id) throw new Error("EdgeModel: id is required");
    if (!data.sourceId) throw new Error("EdgeModel: sourceId is required");
    if (!data.targetId) throw new Error("EdgeModel: targetId is required");

    // Core properties
    this.id = data.id;
    this.sourceId = data.sourceId;
    this.targetId = data.targetId;

    // Connection properties
    this.type = data.type || "straight"; // straight, bezier, orthogonal
    this.sourcePort = data.sourcePort || "right";
    this.targetPort = data.targetPort || "left";

    // Display properties
    this.label = data.label || "";

    // Style properties
    this.style = data.style || {
      stroke: "#000000",
      strokeWidth: 2,
      markerEnd: "url(#arrowhead)",
    };

    // Custom data
    this.metadata = data.metadata || {};

    // Timestamps
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Update edge properties
   *
   * @param {Object} updates - Properties to update
   *
   * @example
   * edge.update({ label: 'Yes', type: 'bezier' });
   */
  update(updates) {
    if (updates && typeof updates === "object") {
      Object.assign(this, updates);
      this.updatedAt = new Date();
    }
  }

  /**
   * Create a deep copy of this edge
   *
   * @returns {EdgeModel} Deep copy
   *
   * @example
   * const copy = edge.clone();
   * copy.id = 'edge_2';
   */
  clone() {
    return new EdgeModel({
      id: this.id,
      sourceId: this.sourceId,
      targetId: this.targetId,
      type: this.type,
      label: this.label,
      sourcePort: this.sourcePort,
      targetPort: this.targetPort,
      style: { ...this.style },
      metadata: { ...this.metadata },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }

  /**
   * Convert edge to plain object
   *
   * @returns {Object} Plain object representation
   *
   * @example
   * const json = edge.toJSON();
   */
  toJSON() {
    return {
      id: this.id,
      sourceId: this.sourceId,
      targetId: this.targetId,
      type: this.type,
      label: this.label,
      sourcePort: this.sourcePort,
      targetPort: this.targetPort,
      style: this.style,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Create edge from JSON
   *
   * @param {Object} json - Plain object from JSON
   *
   * @returns {EdgeModel} New edge instance
   *
   * @example
   * const edge = EdgeModel.fromJSON(json);
   */
  static fromJSON(json) {
    return new EdgeModel(json);
  }

  /**
   * Check equality with another edge
   *
   * @param {EdgeModel} other - Another edge
   *
   * @returns {boolean} True if edges have same core properties
   */
  equals(other) {
    return (
      this.id === other.id &&
      this.sourceId === other.sourceId &&
      this.targetId === other.targetId &&
      this.type === other.type &&
      this.label === other.label
    );
  }

  /**
   * Check if this edge connects two specific nodes
   *
   * Used for querying edges between nodes.
   *
   * @param {string} nodeId1 - First node ID
   * @param {string} nodeId2 - Second node ID
   * @param {boolean} [directed=true] - If false, checks both directions
   *
   * @returns {boolean} True if edge connects these nodes
   *
   * @example
   * if (edge.connects('node_1', 'node_2')) {
   *   console.log('Edge goes from node_1 to node_2');
   * }
   *
   * // Check both directions
   * if (edge.connects('node_2', 'node_1', false)) {
   *   console.log('Edge connects these nodes (either direction)');
   * }
   */
  connects(nodeId1, nodeId2, directed = true) {
    if (directed) {
      return this.sourceId === nodeId1 && this.targetId === nodeId2;
    } else {
      return (
        (this.sourceId === nodeId1 && this.targetId === nodeId2) ||
        (this.sourceId === nodeId2 && this.targetId === nodeId1)
      );
    }
  }
}

export { EdgeModel };
