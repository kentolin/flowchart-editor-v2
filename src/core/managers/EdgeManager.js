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
import { DebugLogger } from "../../utils/debug/DebugLogger.js";

export class EdgeManager {
  constructor(editor, nodeManager, eventBus) {
    // Initialize debug logger
    this.log = new DebugLogger("EdgeManager", "#9C27B0");
    this.log.enter("constructor");

    this.editor = editor;
    this.nodeManager = nodeManager;
    this.eventBus = eventBus;

    // Note: StateManager is accessed via editor if needed
    this.stateManager = null; // Will be set if needed

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

    this.log.info("constructor", "✓ EdgeManager initialized");
    this.log.exit("constructor");
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    this.log.enter("_setupEventListeners");

    // When a node is deleted, remove all connected edges
    this.eventBus.on("node:deleted", ({ nodeId }) => {
      this.log.info(
        "_setupEventListeners",
        `Node '${nodeId}' deleted, removing connected edges`
      );
      this.deleteEdgesForNode(nodeId);
    });

    // When a node moves, update edge paths
    this.eventBus.on("node:moved", ({ nodeId }) => {
      this.log.info(
        "_setupEventListeners",
        `Node '${nodeId}' moved, updating edge paths`
      );
      this.updateEdgesForNode(nodeId);
    });

    this.log.info("_setupEventListeners", "✓ Event listeners registered");
    this.log.exit("_setupEventListeners");
  }

  /**
   * Create a new edge
   * @param {Object} data - Edge data
   * @returns {string} - Created edge ID
   */
  createEdge(data) {
    this.log.enter("createEdge", {
      sourceId: data.sourceId,
      targetId: data.targetId,
    });

    try {
      // Validate source and target nodes exist
      if (!this.nodeManager.hasNode(data.sourceId)) {
        this.log.error("createEdge", `Source node ${data.sourceId} not found`);
        throw new Error(`Source node ${data.sourceId} not found`);
      }
      if (!this.nodeManager.hasNode(data.targetId)) {
        this.log.error("createEdge", `Target node ${data.targetId} not found`);
        throw new Error(`Target node ${data.targetId} not found`);
      }

      this.log.info("createEdge", "Source and target nodes validated");

      // Validate connection rules
      if (!this._validateConnection(data.sourceId, data.targetId)) {
        this.log.error("createEdge", "Connection not allowed by rules");
        throw new Error("Connection not allowed by rules");
      }

      // Generate ID if not provided
      const edgeId = data.id || this._generateEdgeId();
      this.log.info("createEdge", `Generated edge ID: ${edgeId}`);

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
      this.log.info("createEdge", `Created EdgeModel instance`);

      // Store edge
      this.edges.set(edgeId, edge);
      this.log.info(
        "createEdge",
        `Stored edge in map (total: ${this.edges.size})`
      );

      // Track by nodes
      this._addEdgeToNodeTracking(edgeId, data.sourceId, data.targetId);

      // Track by type
      if (!this.edgesByType.has(edgeData.type)) {
        this.edgesByType.set(edgeData.type, new Set());
        this.log.info(
          "createEdge",
          `Created new type set for '${edgeData.type}'`
        );
      }
      this.edgesByType.get(edgeData.type).add(edgeId);

      // Update state
      this._updateState();

      // Emit events
      this.eventBus.emit("edge:created", {
        edgeId,
        edge: edge.toJSON(),
        sourceId: data.sourceId,
        targetId: data.targetId,
      });

      this.log.info("createEdge", `✓ Edge '${edgeId}' created successfully`);
      this.log.exit("createEdge");

      return edgeId;
    } catch (error) {
      this.log.error("createEdge", "Failed to create edge:", error);
      this.eventBus.emit("edge:error", { operation: "create", error });
      this.log.exit("createEdge");
      throw error;
    }
  }

  /**
   * Create multiple edges at once
   * @param {Array} edgesData - Array of edge data objects
   * @returns {Array} - Array of created edge IDs
   */
  createEdges(edgesData) {
    this.log.enter("createEdges", { count: edgesData.length });

    const edgeIds = edgesData
      .map((data) => {
        try {
          return this.createEdge(data);
        } catch (error) {
          this.log.error("createEdges", "Failed to create edge:", error);
          return null;
        }
      })
      .filter(Boolean);

    this.log.info(
      "createEdges",
      `✓ Created ${edgeIds.length}/${edgesData.length} edges`
    );
    this.log.exit("createEdges");

    return edgeIds;
  }

  /**
   * Get an edge by ID
   * @param {string} edgeId - Edge identifier
   * @returns {EdgeModel|null}
   */
  getEdge(edgeId) {
    this.log.enter("getEdge", { edgeId });

    const edge = this.edges.get(edgeId) || null;

    if (edge) {
      this.log.info("getEdge", `Found edge '${edgeId}'`);
    } else {
      this.log.warn("getEdge", `Edge '${edgeId}' not found`);
    }

    this.log.exit("getEdge");
    return edge;
  }

  /**
   * Get multiple edges by IDs
   * @param {Array} edgeIds - Array of edge IDs
   * @returns {Array}
   */
  getEdges(edgeIds) {
    this.log.enter("getEdges", { count: edgeIds.length });

    const edges = edgeIds.map((id) => this.getEdge(id)).filter(Boolean);

    this.log.info(
      "getEdges",
      `Retrieved ${edges.length}/${edgeIds.length} edges`
    );
    this.log.exit("getEdges");

    return edges;
  }

  /**
   * Get all edges
   * @returns {Array}
   */
  getAllEdges() {
    this.log.enter("getAllEdges");

    const edges = Array.from(this.edges.values());

    this.log.info("getAllEdges", `Returning ${edges.length} edges`);
    this.log.exit("getAllEdges");

    return edges;
  }

  /**
   * Get edges by type
   * @param {string} type - Edge type
   * @returns {Array}
   */
  getEdgesByType(type) {
    this.log.enter("getEdgesByType", { type });

    const edgeIds = this.edgesByType.get(type);
    if (!edgeIds) {
      this.log.info("getEdgesByType", `No edges of type '${type}'`);
      this.log.exit("getEdgesByType");
      return [];
    }

    const edges = Array.from(edgeIds)
      .map((id) => this.getEdge(id))
      .filter(Boolean);

    this.log.info(
      "getEdgesByType",
      `Found ${edges.length} edges of type '${type}'`
    );
    this.log.exit("getEdgesByType");

    return edges;
  }

  /**
   * Get edges connected to a node
   * @param {string} nodeId - Node identifier
   * @returns {Array}
   */
  getEdgesForNode(nodeId) {
    this.log.enter("getEdgesForNode", { nodeId });

    const edgeIds = this.edgesByNode.get(nodeId);
    if (!edgeIds) {
      this.log.info("getEdgesForNode", `No edges for node '${nodeId}'`);
      this.log.exit("getEdgesForNode");
      return [];
    }

    const edges = Array.from(edgeIds)
      .map((id) => this.getEdge(id))
      .filter(Boolean);

    this.log.info(
      "getEdgesForNode",
      `Found ${edges.length} edges for node '${nodeId}'`
    );
    this.log.exit("getEdgesForNode");

    return edges;
  }

  /**
   * Get incoming edges for a node (target = nodeId)
   * @param {string} nodeId - Node identifier
   * @returns {Array}
   */
  getIncomingEdges(nodeId) {
    this.log.enter("getIncomingEdges", { nodeId });

    const edges = this.getEdgesForNode(nodeId).filter(
      (edge) => edge.targetId === nodeId
    );

    this.log.info("getIncomingEdges", `Found ${edges.length} incoming edges`);
    this.log.exit("getIncomingEdges");

    return edges;
  }

  /**
   * Get outgoing edges for a node (source = nodeId)
   * @param {string} nodeId - Node identifier
   * @returns {Array}
   */
  getOutgoingEdges(nodeId) {
    this.log.enter("getOutgoingEdges", { nodeId });

    const edges = this.getEdgesForNode(nodeId).filter(
      (edge) => edge.sourceId === nodeId
    );

    this.log.info("getOutgoingEdges", `Found ${edges.length} outgoing edges`);
    this.log.exit("getOutgoingEdges");

    return edges;
  }

  /**
   * Get edge between two nodes
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID
   * @returns {EdgeModel|null}
   */
  getEdgeBetweenNodes(sourceId, targetId) {
    this.log.enter("getEdgeBetweenNodes", { sourceId, targetId });

    const edges = this.getEdgesForNode(sourceId);
    const edge =
      edges.find(
        (edge) => edge.sourceId === sourceId && edge.targetId === targetId
      ) || null;

    if (edge) {
      this.log.info("getEdgeBetweenNodes", `Found edge '${edge.id}'`);
    } else {
      this.log.info("getEdgeBetweenNodes", "No edge found between nodes");
    }

    this.log.exit("getEdgeBetweenNodes");
    return edge;
  }

  /**
   * Get all edges between two nodes (bidirectional)
   * @param {string} nodeId1 - First node ID
   * @param {string} nodeId2 - Second node ID
   * @returns {Array}
   */
  getAllEdgesBetweenNodes(nodeId1, nodeId2) {
    this.log.enter("getAllEdgesBetweenNodes", { nodeId1, nodeId2 });

    const edges1 = this.getEdgesForNode(nodeId1);
    const edges = edges1.filter(
      (edge) =>
        (edge.sourceId === nodeId1 && edge.targetId === nodeId2) ||
        (edge.sourceId === nodeId2 && edge.targetId === nodeId1)
    );

    this.log.info("getAllEdgesBetweenNodes", `Found ${edges.length} edges`);
    this.log.exit("getAllEdgesBetweenNodes");

    return edges;
  }

  /**
   * Check if edge exists
   * @param {string} edgeId - Edge identifier
   * @returns {boolean}
   */
  hasEdge(edgeId) {
    const exists = this.edges.has(edgeId);
    this.log.info("hasEdge", `Edge '${edgeId}' exists: ${exists}`);
    return exists;
  }

  /**
   * Check if connection exists between nodes
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID
   * @returns {boolean}
   */
  hasConnection(sourceId, targetId) {
    const exists = this.getEdgeBetweenNodes(sourceId, targetId) !== null;
    this.log.info("hasConnection", `Connection exists: ${exists}`);
    return exists;
  }

  /**
   * Update edge properties
   * @param {string} edgeId - Edge identifier
   * @param {Object} updates - Properties to update
   */
  updateEdge(edgeId, updates) {
    this.log.enter("updateEdge", { edgeId, updates });

    const edge = this.getEdge(edgeId);
    if (!edge) {
      this.log.warn("updateEdge", `Edge ${edgeId} not found`);
      this.log.exit("updateEdge");
      return false;
    }

    try {
      // Store old values for undo
      const oldValues = {};
      Object.keys(updates).forEach((key) => {
        oldValues[key] = edge[key];
      });

      this.log.info(
        "updateEdge",
        `Updating properties: ${Object.keys(updates).join(", ")}`
      );

      // Handle source/target changes
      if (updates.sourceId || updates.targetId) {
        const newSourceId = updates.sourceId || edge.sourceId;
        const newTargetId = updates.targetId || edge.targetId;

        // Validate new connection
        if (!this._validateConnection(newSourceId, newTargetId)) {
          this.log.error("updateEdge", "New connection not allowed by rules");
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
        this.log.info(
          "updateEdge",
          `Type changed from '${oldValues.type}' to '${updates.type}'`
        );
        this._updateEdgeTypeTracking(edgeId, oldValues.type, updates.type);
      }

      // Update state
      this._updateState();

      // Emit event
      this.eventBus.emit("edge:updated", {
        edgeId,
        updates,
        oldValues,
        edge: edge.toJSON(),
      });

      this.log.info("updateEdge", `✓ Edge '${edgeId}' updated`);
      this.log.exit("updateEdge");

      return true;
    } catch (error) {
      this.log.error("updateEdge", "Failed to update edge:", error);
      this.eventBus.emit("edge:error", { operation: "update", edgeId, error });
      this.log.exit("updateEdge");
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
    this.log.enter("updateEdgeProperty", { edgeId, property, value });

    const result = this.updateEdge(edgeId, { [property]: value });

    this.log.exit("updateEdgeProperty");
    return result;
  }

  /**
   * Delete an edge
   * @param {string} edgeId - Edge identifier
   * @returns {boolean}
   */
  deleteEdge(edgeId) {
    this.log.enter("deleteEdge", { edgeId });

    const edge = this.getEdge(edgeId);
    if (!edge) {
      this.log.warn("deleteEdge", `Edge ${edgeId} not found`);
      this.log.exit("deleteEdge");
      return false;
    }

    try {
      // Store edge data for undo
      const edgeData = edge.toJSON();

      // Remove from node tracking
      this._removeEdgeFromNodeTracking(edgeId, edge.sourceId, edge.targetId);

      // Remove from type tracking
      const typeSet = this.edgesByType.get(edge.type);
      if (typeSet) {
        typeSet.delete(edgeId);
        this.log.info(
          "deleteEdge",
          `Removed from type '${edge.type}' tracking`
        );
      }

      // Remove edge
      this.edges.delete(edgeId);
      this.log.info(
        "deleteEdge",
        `Removed from edges map (remaining: ${this.edges.size})`
      );

      // Update state
      this._updateState();

      // Emit event
      this.eventBus.emit("edge:deleted", {
        edgeId,
        edgeData,
      });

      this.log.info("deleteEdge", `✓ Edge '${edgeId}' deleted`);
      this.log.exit("deleteEdge");

      return true;
    } catch (error) {
      this.log.error("deleteEdge", "Failed to delete edge:", error);
      this.eventBus.emit("edge:error", { operation: "delete", edgeId, error });
      this.log.exit("deleteEdge");
      return false;
    }
  }

  /**
   * Delete multiple edges
   * @param {Array} edgeIds - Array of edge IDs
   * @returns {Array} - Successfully deleted edge IDs
   */
  deleteEdges(edgeIds) {
    this.log.enter("deleteEdges", { count: edgeIds.length });

    const deleted = [];

    edgeIds.forEach((edgeId) => {
      if (this.deleteEdge(edgeId)) {
        deleted.push(edgeId);
      }
    });

    this.log.info(
      "deleteEdges",
      `✓ Deleted ${deleted.length}/${edgeIds.length} edges`
    );
    this.log.exit("deleteEdges");

    return deleted;
  }

  /**
   * Delete all edges connected to a node
   * @param {string} nodeId - Node identifier
   * @returns {Array} - Deleted edge IDs
   */
  deleteEdgesForNode(nodeId) {
    this.log.enter("deleteEdgesForNode", { nodeId });

    const edgeIds = Array.from(this.edgesByNode.get(nodeId) || []);
    const deleted = this.deleteEdges(edgeIds);

    this.log.info(
      "deleteEdgesForNode",
      `✓ Deleted ${deleted.length} edges for node '${nodeId}'`
    );
    this.log.exit("deleteEdgesForNode");

    return deleted;
  }

  /**
   * Update edge paths for a node (when node moves)
   * @param {string} nodeId - Node identifier
   */
  updateEdgesForNode(nodeId) {
    this.log.enter("updateEdgesForNode", { nodeId });

    const edges = this.getEdgesForNode(nodeId);

    edges.forEach((edge) => {
      this.eventBus.emit("edge:path:update", {
        edgeId: edge.id,
        sourceId: edge.sourceId,
        targetId: edge.targetId,
      });
    });

    this.log.info("updateEdgesForNode", `✓ Updated ${edges.length} edge paths`);
    this.log.exit("updateEdgesForNode");
  }

  /**
   * Clear all edges
   */
  clearAll() {
    this.log.enter("clearAll");

    const edgeIds = Array.from(this.edges.keys());
    const count = edgeIds.length;

    edgeIds.forEach((edgeId) => {
      this.deleteEdge(edgeId);
    });

    this.edges.clear();
    this.edgesByNode.clear();
    this.edgesByType.clear();
    this.nextEdgeId = 1;

    this._updateState();

    this.eventBus.emit("edges:cleared");

    this.log.info("clearAll", `✓ Cleared ${count} edges`);
    this.log.exit("clearAll");
  }

  /**
   * Get edge statistics
   * @returns {Object}
   */
  getStats() {
    this.log.enter("getStats");

    const typeStats = {};

    this.edgesByType.forEach((edgeIds, type) => {
      typeStats[type] = edgeIds.size;
    });

    const nodeStats = {};
    this.edgesByNode.forEach((edgeIds, nodeId) => {
      nodeStats[nodeId] = edgeIds.size;
    });

    const stats = {
      totalEdges: this.edges.size,
      byType: typeStats,
      byNode: nodeStats,
      nextId: this.nextEdgeId,
    };

    this.log.info(
      "getStats",
      `Total edges: ${stats.totalEdges}, Types: ${
        Object.keys(typeStats).length
      }`
    );
    this.log.exit("getStats");

    return stats;
  }

  /**
   * Find edges by criteria
   * @param {Function} predicate - Filter function
   * @returns {Array}
   */
  findEdges(predicate) {
    this.log.enter("findEdges");

    const edges = this.getAllEdges().filter(predicate);

    this.log.info("findEdges", `Found ${edges.length} matching edges`);
    this.log.exit("findEdges");

    return edges;
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
    this.log.enter("addConnectionRule", { ruleId });

    this.connectionRules.set(ruleId, validator);

    this.log.info("addConnectionRule", `✓ Added rule '${ruleId}'`);
    this.log.exit("addConnectionRule");
  }

  /**
   * Remove connection rule
   * @param {string} ruleId - Rule identifier
   */
  removeConnectionRule(ruleId) {
    this.log.enter("removeConnectionRule", { ruleId });

    this.connectionRules.delete(ruleId);

    this.log.info("removeConnectionRule", `✓ Removed rule '${ruleId}'`);
    this.log.exit("removeConnectionRule");
  }

  /**
   * Validate a potential connection
   * @private
   */
  _validateConnection(sourceId, targetId) {
    this.log.enter("_validateConnection", { sourceId, targetId });

    // Don't allow self-loops by default
    if (sourceId === targetId) {
      this.log.warn("_validateConnection", "Self-loops not allowed");
      this.log.exit("_validateConnection");
      return false;
    }

    // Check all connection rules
    for (const [ruleId, validator] of this.connectionRules) {
      try {
        if (!validator(sourceId, targetId)) {
          this.log.warn(
            "_validateConnection",
            `Rule '${ruleId}' rejected connection`
          );
          this.log.exit("_validateConnection");
          return false;
        }
      } catch (error) {
        this.log.error(
          "_validateConnection",
          `Error in rule '${ruleId}':`,
          error
        );
      }
    }

    this.log.info("_validateConnection", "✓ Connection validated");
    this.log.exit("_validateConnection");
    return true;
  }

  /**
   * Calculate edge path points
   * @param {string} edgeId - Edge identifier
   * @returns {Array} - Array of {x, y} points
   */
  calculateEdgePath(edgeId) {
    this.log.enter("calculateEdgePath", { edgeId });

    const edge = this.getEdge(edgeId);
    if (!edge) {
      this.log.warn("calculateEdgePath", `Edge '${edgeId}' not found`);
      this.log.exit("calculateEdgePath");
      return [];
    }

    const sourceNode = this.nodeManager.getNode(edge.sourceId);
    const targetNode = this.nodeManager.getNode(edge.targetId);

    if (!sourceNode || !targetNode) {
      this.log.warn("calculateEdgePath", "Source or target node not found");
      this.log.exit("calculateEdgePath");
      return [];
    }

    const sourceBounds = this.nodeManager.getNodeBounds(edge.sourceId);
    const targetBounds = this.nodeManager.getNodeBounds(edge.targetId);

    let points = [];

    // Calculate connection points based on edge type
    switch (edge.type) {
      case "straight":
        points = [
          { x: sourceBounds.centerX, y: sourceBounds.centerY },
          { x: targetBounds.centerX, y: targetBounds.centerY },
        ];
        break;

      case "bezier":
        points = this._calculateBezierPath(sourceBounds, targetBounds);
        break;

      case "orthogonal":
        points = this._calculateOrthogonalPath(sourceBounds, targetBounds);
        break;

      default:
        points = [
          { x: sourceBounds.centerX, y: sourceBounds.centerY },
          { x: targetBounds.centerX, y: targetBounds.centerY },
        ];
        break;
    }

    this.log.info(
      "calculateEdgePath",
      `Calculated ${points.length} points for ${edge.type} path`
    );
    this.log.exit("calculateEdgePath");

    return points;
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
    const id = `edge_${this.nextEdgeId++}`;
    this.log.info("_generateEdgeId", `Generated ID: ${id}`);
    return id;
  }

  /**
   * Add edge to node tracking
   * @private
   */
  _addEdgeToNodeTracking(edgeId, sourceId, targetId) {
    this.log.enter("_addEdgeToNodeTracking", { edgeId, sourceId, targetId });

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

    this.log.info("_addEdgeToNodeTracking", "✓ Added to node tracking");
    this.log.exit("_addEdgeToNodeTracking");
  }

  /**
   * Remove edge from node tracking
   * @private
   */
  _removeEdgeFromNodeTracking(edgeId, sourceId, targetId) {
    this.log.enter("_removeEdgeFromNodeTracking", {
      edgeId,
      sourceId,
      targetId,
    });

    const sourceSet = this.edgesByNode.get(sourceId);
    if (sourceSet) {
      sourceSet.delete(edgeId);
    }

    const targetSet = this.edgesByNode.get(targetId);
    if (targetSet) {
      targetSet.delete(edgeId);
    }

    this.log.info(
      "_removeEdgeFromNodeTracking",
      "✓ Removed from node tracking"
    );
    this.log.exit("_removeEdgeFromNodeTracking");
  }

  /**
   * Update edge type tracking
   * @private
   */
  _updateEdgeTypeTracking(edgeId, oldType, newType) {
    this.log.enter("_updateEdgeTypeTracking", { edgeId, oldType, newType });

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

    this.log.info(
      "_updateEdgeTypeTracking",
      `✓ Moved edge from type '${oldType}' to '${newType}'`
    );
    this.log.exit("_updateEdgeTypeTracking");
  }

  /**
   * Update state manager
   * @private
   */
  _updateState() {
    if (!this.stateManager) return;

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
    this.log.enter("serialize");

    const data = this.getAllEdges().map((edge) => edge.toJSON());

    this.log.info("serialize", `Serialized ${data.length} edges`);
    this.log.exit("serialize");

    return data;
  }

  /**
   * Deserialize and load edges
   * @param {Array} edgesData - Serialized edges
   */
  deserialize(edgesData) {
    this.log.enter("deserialize", { count: edgesData.length });

    // Clear existing edges
    this.clearAll();

    // Create edges from data
    edgesData.forEach((edgeData) => {
      try {
        this.createEdge(edgeData);
      } catch (error) {
        this.log.error("deserialize", "Failed to deserialize edge:", error);
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

    this.log.info(
      "deserialize",
      `✓ Deserialized ${edgesData.length} edges, next ID: ${this.nextEdgeId}`
    );
    this.log.exit("deserialize");
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.log.enter("destroy");

    this.clearAll();
    this.eventBus.off("node:deleted");
    this.eventBus.off("node:moved");

    this.log.info("destroy", "✓ EdgeManager destroyed");
    this.log.exit("destroy");
  }
}
