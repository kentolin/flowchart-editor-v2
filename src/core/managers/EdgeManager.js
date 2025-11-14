/**
 * EdgeManager.js - Manages all edge/connection operations
 *
 * Responsibilities:
 * - Create, read, update, delete edges
 * - Track all edges in the graph
 * - Manage edge routing and paths
 * - Handle edge properties and styling
 * - Validate edge connections
 * - Emit edge lifecycle events
 *
 * @module core/managers/EdgeManager
 */

import { EdgeModel } from "../models/EdgeModel.js";

export class EdgeManager {
  constructor(eventBus, stateManager, nodeManager) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.nodeManager = nodeManager;

    // Edge storage
    this.edges = new Map(); // edgeId -> EdgeModel

    // ID generation
    this.nextEdgeId = 1;

    // Edge tracking
    this.edgesByNode = new Map(); // nodeId -> Set of edge IDs
    this.edgesByType = new Map(); // type -> Set of edge IDs

    // Connection rules
    this.connectionRules = new Map();

    this._setupEventListeners();
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    // When a node is deleted, remove all connected edges
    this.eventBus.on("node:deleted", ({ nodeId }) => {
      this.deleteEdgesForNode(nodeId);
    });

    // When a node moves, update edge paths
    this.eventBus.on("node:moved", ({ nodeId }) => {
      this.updateEdgesForNode(nodeId);
    });
  }

  /**
   * Create a new edge
   * @param {Object} data - Edge data
   * @returns {string} - Created edge ID
   */
  createEdge(data) {
    try {
      // Validate source and target nodes exist
      if (!this.nodeManager.hasNode(data.sourceId)) {
        throw new Error(`Source node ${data.sourceId} not found`);
      }
      if (!this.nodeManager.hasNode(data.targetId)) {
        throw new Error(`Target node ${data.targetId} not found`);
      }

      // Validate connection rules
      if (!this._validateConnection(data.sourceId, data.targetId)) {
        throw new Error("Connection not allowed by rules");
      }

      // Generate ID if not provided
      const edgeId = data.id || this._generateEdgeId();

      // Create edge model
      const edgeData = {
        id: edgeId,
        sourceId: data.sourceId,
        targetId: data.targetId,
        sourcePort: data.sourcePort || null,
        targetPort: data.targetPort || null,
        type: data.type || "straight",
        label: data.label || "",
        style: data.style || {},
        data: data.data || {},
        animated: data.animated || false,
        markers: data.markers || { start: null, end: "arrow" },
      };

      const edge = new EdgeModel(edgeData);

      // Store edge
      this.edges.set(edgeId, edge);

      // Track by nodes
      this._addEdgeToNodeTracking(edgeId, data.sourceId, data.targetId);

      // Track by type
      if (!this.edgesByType.has(edgeData.type)) {
        this.edgesByType.set(edgeData.type, new Set());
      }
      this.edgesByType.get(edgeData.type).add(edgeId);

      // Update state
      this._updateState();

      // Emit events
      this.eventBus.emit("edge:created", {
        edgeId,
        edge: edge.serialize(),
        sourceId: data.sourceId,
        targetId: data.targetId,
      });

      return edgeId;
    } catch (error) {
      console.error("Error creating edge:", error);
      this.eventBus.emit("edge:error", { operation: "create", error });
      throw error;
    }
  }

  /**
   * Create multiple edges at once
   * @param {Array} edgesData - Array of edge data objects
   * @returns {Array} - Array of created edge IDs
   */
  createEdges(edgesData) {
    return edgesData
      .map((data) => {
        try {
          return this.createEdge(data);
        } catch (error) {
          console.error("Error creating edge:", error);
          return null;
        }
      })
      .filter(Boolean);
  }

  /**
   * Get an edge by ID
   * @param {string} edgeId - Edge identifier
   * @returns {EdgeModel|null}
   */
  getEdge(edgeId) {
    return this.edges.get(edgeId) || null;
  }

  /**
   * Get multiple edges by IDs
   * @param {Array} edgeIds - Array of edge IDs
   * @returns {Array}
   */
  getEdges(edgeIds) {
    return edgeIds.map((id) => this.getEdge(id)).filter(Boolean);
  }

  /**
   * Get all edges
   * @returns {Array}
   */
  getAllEdges() {
    return Array.from(this.edges.values());
  }

  /**
   * Get edges by type
   * @param {string} type - Edge type
   * @returns {Array}
   */
  getEdgesByType(type) {
    const edgeIds = this.edgesByType.get(type);
    if (!edgeIds) return [];

    return Array.from(edgeIds)
      .map((id) => this.getEdge(id))
      .filter(Boolean);
  }

  /**
   * Get edges connected to a node
   * @param {string} nodeId - Node identifier
   * @returns {Array}
   */
  getEdgesForNode(nodeId) {
    const edgeIds = this.edgesByNode.get(nodeId);
    if (!edgeIds) return [];

    return Array.from(edgeIds)
      .map((id) => this.getEdge(id))
      .filter(Boolean);
  }

  /**
   * Get incoming edges for a node (target = nodeId)
   * @param {string} nodeId - Node identifier
   * @returns {Array}
   */
  getIncomingEdges(nodeId) {
    return this.getEdgesForNode(nodeId).filter(
      (edge) => edge.targetId === nodeId
    );
  }

  /**
   * Get outgoing edges for a node (source = nodeId)
   * @param {string} nodeId - Node identifier
   * @returns {Array}
   */
  getOutgoingEdges(nodeId) {
    return this.getEdgesForNode(nodeId).filter(
      (edge) => edge.sourceId === nodeId
    );
  }

  /**
   * Get edge between two nodes
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID
   * @returns {EdgeModel|null}
   */
  getEdgeBetweenNodes(sourceId, targetId) {
    const edges = this.getEdgesForNode(sourceId);
    return (
      edges.find(
        (edge) => edge.sourceId === sourceId && edge.targetId === targetId
      ) || null
    );
  }

  /**
   * Get all edges between two nodes (bidirectional)
   * @param {string} nodeId1 - First node ID
   * @param {string} nodeId2 - Second node ID
   * @returns {Array}
   */
  getAllEdgesBetweenNodes(nodeId1, nodeId2) {
    const edges1 = this.getEdgesForNode(nodeId1);
    return edges1.filter(
      (edge) =>
        (edge.sourceId === nodeId1 && edge.targetId === nodeId2) ||
        (edge.sourceId === nodeId2 && edge.targetId === nodeId1)
    );
  }

  /**
   * Check if edge exists
   * @param {string} edgeId - Edge identifier
   * @returns {boolean}
   */
  hasEdge(edgeId) {
    return this.edges.has(edgeId);
  }

  /**
   * Check if connection exists between nodes
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID
   * @returns {boolean}
   */
  hasConnection(sourceId, targetId) {
    return this.getEdgeBetweenNodes(sourceId, targetId) !== null;
  }

  /**
   * Update edge properties
   * @param {string} edgeId - Edge identifier
   * @param {Object} updates - Properties to update
   */
  updateEdge(edgeId, updates) {
    const edge = this.getEdge(edgeId);
    if (!edge) {
      console.warn(`Edge ${edgeId} not found`);
      return false;
    }

    try {
      // Store old values for undo
      const oldValues = {};
      Object.keys(updates).forEach((key) => {
        oldValues[key] = edge[key];
      });

      // Handle source/target changes
      if (updates.sourceId || updates.targetId) {
        const newSourceId = updates.sourceId || edge.sourceId;
        const newTargetId = updates.targetId || edge.targetId;

        // Validate new connection
        if (!this._validateConnection(newSourceId, newTargetId)) {
          throw new Error("New connection not allowed by rules");
        }

        // Update node tracking
        this._removeEdgeFromNodeTracking(edgeId, edge.sourceId, edge.targetId);
        this._addEdgeToNodeTracking(edgeId, newSourceId, newTargetId);
      }

      // Apply updates
      Object.assign(edge, updates);

      // Update type tracking if type changed
      if (updates.type && updates.type !== oldValues.type) {
        this._updateEdgeTypeTracking(edgeId, oldValues.type, updates.type);
      }

      // Update state
      this._updateState();

      // Emit event
      this.eventBus.emit("edge:updated", {
        edgeId,
        updates,
        oldValues,
        edge: edge.serialize(),
      });

      return true;
    } catch (error) {
      console.error("Error updating edge:", error);
      this.eventBus.emit("edge:error", { operation: "update", edgeId, error });
      return false;
    }
  }

  /**
   * Update a single edge property
   * @param {string} edgeId - Edge identifier
   * @param {string} property - Property name
   * @param {*} value - New value
   */
  updateEdgeProperty(edgeId, property, value) {
    return this.updateEdge(edgeId, { [property]: value });
  }

  /**
   * Delete an edge
   * @param {string} edgeId - Edge identifier
   * @returns {boolean}
   */
  deleteEdge(edgeId) {
    const edge = this.getEdge(edgeId);
    if (!edge) {
      console.warn(`Edge ${edgeId} not found`);
      return false;
    }

    try {
      // Store edge data for undo
      const edgeData = edge.serialize();

      // Remove from node tracking
      this._removeEdgeFromNodeTracking(edgeId, edge.sourceId, edge.targetId);

      // Remove from type tracking
      const typeSet = this.edgesByType.get(edge.type);
      if (typeSet) {
        typeSet.delete(edgeId);
      }

      // Remove edge
      this.edges.delete(edgeId);

      // Update state
      this._updateState();

      // Emit event
      this.eventBus.emit("edge:deleted", {
        edgeId,
        edgeData,
      });

      return true;
    } catch (error) {
      console.error("Error deleting edge:", error);
      this.eventBus.emit("edge:error", { operation: "delete", edgeId, error });
      return false;
    }
  }

  /**
   * Delete multiple edges
   * @param {Array} edgeIds - Array of edge IDs
   * @returns {Array} - Successfully deleted edge IDs
   */
  deleteEdges(edgeIds) {
    const deleted = [];

    edgeIds.forEach((edgeId) => {
      if (this.deleteEdge(edgeId)) {
        deleted.push(edgeId);
      }
    });

    return deleted;
  }

  /**
   * Delete all edges connected to a node
   * @param {string} nodeId - Node identifier
   * @returns {Array} - Deleted edge IDs
   */
  deleteEdgesForNode(nodeId) {
    const edgeIds = Array.from(this.edgesByNode.get(nodeId) || []);
    return this.deleteEdges(edgeIds);
  }

  /**
   * Update edge paths for a node (when node moves)
   * @param {string} nodeId - Node identifier
   */
  updateEdgesForNode(nodeId) {
    const edges = this.getEdgesForNode(nodeId);

    edges.forEach((edge) => {
      this.eventBus.emit("edge:path:update", {
        edgeId: edge.id,
        sourceId: edge.sourceId,
        targetId: edge.targetId,
      });
    });
  }

  /**
   * Clear all edges
   */
  clearAll() {
    const edgeIds = Array.from(this.edges.keys());

    edgeIds.forEach((edgeId) => {
      this.deleteEdge(edgeId);
    });

    this.edges.clear();
    this.edgesByNode.clear();
    this.edgesByType.clear();
    this.nextEdgeId = 1;

    this._updateState();

    this.eventBus.emit("edges:cleared");
  }

  /**
   * Get edge statistics
   * @returns {Object}
   */
  getStats() {
    const typeStats = {};

    this.edgesByType.forEach((edgeIds, type) => {
      typeStats[type] = edgeIds.size;
    });

    const nodeStats = {};
    this.edgesByNode.forEach((edgeIds, nodeId) => {
      nodeStats[nodeId] = edgeIds.size;
    });

    return {
      totalEdges: this.edges.size,
      byType: typeStats,
      byNode: nodeStats,
      nextId: this.nextEdgeId,
    };
  }

  /**
   * Find edges by criteria
   * @param {Function} predicate - Filter function
   * @returns {Array}
   */
  findEdges(predicate) {
    return this.getAllEdges().filter(predicate);
  }

  /**
   * Get edge count
   * @returns {number}
   */
  getEdgeCount() {
    return this.edges.size;
  }

  /**
   * Add connection rule
   * @param {string} ruleId - Rule identifier
   * @param {Function} validator - Validation function (sourceId, targetId) => boolean
   */
  addConnectionRule(ruleId, validator) {
    this.connectionRules.set(ruleId, validator);
  }

  /**
   * Remove connection rule
   * @param {string} ruleId - Rule identifier
   */
  removeConnectionRule(ruleId) {
    this.connectionRules.delete(ruleId);
  }

  /**
   * Validate a potential connection
   * @private
   */
  _validateConnection(sourceId, targetId) {
    // Don't allow self-loops by default
    if (sourceId === targetId) {
      return false;
    }

    // Check all connection rules
    for (const [ruleId, validator] of this.connectionRules) {
      try {
        if (!validator(sourceId, targetId)) {
          return false;
        }
      } catch (error) {
        console.error(`Error in connection rule '${ruleId}':`, error);
      }
    }

    return true;
  }

  /**
   * Calculate edge path points
   * @param {string} edgeId - Edge identifier
   * @returns {Array} - Array of {x, y} points
   */
  calculateEdgePath(edgeId) {
    const edge = this.getEdge(edgeId);
    if (!edge) return [];

    const sourceNode = this.nodeManager.getNode(edge.sourceId);
    const targetNode = this.nodeManager.getNode(edge.targetId);

    if (!sourceNode || !targetNode) return [];

    const sourceBounds = this.nodeManager.getNodeBounds(edge.sourceId);
    const targetBounds = this.nodeManager.getNodeBounds(edge.targetId);

    // Calculate connection points based on edge type
    switch (edge.type) {
      case "straight":
        return [
          { x: sourceBounds.centerX, y: sourceBounds.centerY },
          { x: targetBounds.centerX, y: targetBounds.centerY },
        ];

      case "bezier":
        return this._calculateBezierPath(sourceBounds, targetBounds);

      case "orthogonal":
        return this._calculateOrthogonalPath(sourceBounds, targetBounds);

      default:
        return [
          { x: sourceBounds.centerX, y: sourceBounds.centerY },
          { x: targetBounds.centerX, y: targetBounds.centerY },
        ];
    }
  }

  /**
   * Calculate bezier curve path
   * @private
   */
  _calculateBezierPath(sourceBounds, targetBounds) {
    const start = { x: sourceBounds.centerX, y: sourceBounds.centerY };
    const end = { x: targetBounds.centerX, y: targetBounds.centerY };

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const controlOffset = distance * 0.3;

    return [
      start,
      { x: start.x + controlOffset, y: start.y },
      { x: end.x - controlOffset, y: end.y },
      end,
    ];
  }

  /**
   * Calculate orthogonal (right-angle) path
   * @private
   */
  _calculateOrthogonalPath(sourceBounds, targetBounds) {
    const start = { x: sourceBounds.centerX, y: sourceBounds.centerY };
    const end = { x: targetBounds.centerX, y: targetBounds.centerY };

    const midX = (start.x + end.x) / 2;

    return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
  }

  /**
   * Generate unique edge ID
   * @private
   */
  _generateEdgeId() {
    return `edge_${this.nextEdgeId++}`;
  }

  /**
   * Add edge to node tracking
   * @private
   */
  _addEdgeToNodeTracking(edgeId, sourceId, targetId) {
    // Track for source node
    if (!this.edgesByNode.has(sourceId)) {
      this.edgesByNode.set(sourceId, new Set());
    }
    this.edgesByNode.get(sourceId).add(edgeId);

    // Track for target node
    if (!this.edgesByNode.has(targetId)) {
      this.edgesByNode.set(targetId, new Set());
    }
    this.edgesByNode.get(targetId).add(edgeId);
  }

  /**
   * Remove edge from node tracking
   * @private
   */
  _removeEdgeFromNodeTracking(edgeId, sourceId, targetId) {
    const sourceSet = this.edgesByNode.get(sourceId);
    if (sourceSet) {
      sourceSet.delete(edgeId);
    }

    const targetSet = this.edgesByNode.get(targetId);
    if (targetSet) {
      targetSet.delete(edgeId);
    }
  }

  /**
   * Update edge type tracking
   * @private
   */
  _updateEdgeTypeTracking(edgeId, oldType, newType) {
    // Remove from old type
    const oldTypeSet = this.edgesByType.get(oldType);
    if (oldTypeSet) {
      oldTypeSet.delete(edgeId);
    }

    // Add to new type
    if (!this.edgesByType.has(newType)) {
      this.edgesByType.set(newType, new Set());
    }
    this.edgesByType.get(newType).add(edgeId);
  }

  /**
   * Update state manager
   * @private
   */
  _updateState() {
    this.stateManager.setState("edges", {
      count: this.edges.size,
      byType: Object.fromEntries(
        Array.from(this.edgesByType.entries()).map(([type, ids]) => [
          type,
          ids.size,
        ])
      ),
    });
  }

  /**
   * Serialize all edges
   * @returns {Array}
   */
  serialize() {
    return this.getAllEdges().map((edge) => edge.serialize());
  }

  /**
   * Deserialize and load edges
   * @param {Array} edgesData - Serialized edges
   */
  deserialize(edgesData) {
    // Clear existing edges
    this.clearAll();

    // Create edges from data
    edgesData.forEach((edgeData) => {
      try {
        this.createEdge(edgeData);
      } catch (error) {
        console.error("Error deserializing edge:", error);
      }
    });

    // Update next ID to avoid conflicts
    const maxId = Math.max(
      ...edgesData
        .map((e) => e.id)
        .filter((id) => id.startsWith("edge_"))
        .map((id) => parseInt(id.split("_")[1]))
        .filter((n) => !isNaN(n)),
      0
    );

    this.nextEdgeId = maxId + 1;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.clearAll();
    this.eventBus.off("node:deleted");
    this.eventBus.off("node:moved");
  }
}
