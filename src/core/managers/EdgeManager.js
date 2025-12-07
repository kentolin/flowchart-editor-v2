/**
 * EdgeManager.js - Edge Management and Operations
 *
 * Manages the creation, deletion, and manipulation of edges (connections).
 * Handles edge routing, updates, and lifecycle.
 *
 * DEPENDENCIES: Editor, NodeManager, EventBus, StateManager
 *
 * IMPORTANT: Uses StateManager (not EditorState directly)
 *
 * @module core/managers/EdgeManager
 * @version 3.0.0 - Uses Complete StateManager
 */

import { DebugLogger } from "../../utils/debug/DebugLogger.js";
import { EdgeModel } from "../models/EdgeModel.js";

export class EdgeManager {
  /**
   * Create EdgeManager
   *
   * @param {Editor} editor - Editor instance for rendering
   * @param {NodeManager} nodeManager - Node manager
   * @param {EventBus} eventBus - Event bus
   * @param {StateManager} stateManager - State manager (NOT EditorState!)
   */
  constructor(editor, nodeManager, eventBus, stateManager) {
    this.log = new DebugLogger("EdgeManager", "#FF9800");
    this.log.enter("constructor");

    // Validate dependencies
    if (!editor) {
      this.log.error("constructor", "Editor is required");
      throw new Error("EdgeManager: Editor is required");
    }
    if (!nodeManager) {
      this.log.error("constructor", "NodeManager is required");
      throw new Error("EdgeManager: NodeManager is required");
    }
    if (!eventBus) {
      this.log.error("constructor", "EventBus is required");
      throw new Error("EdgeManager: EventBus is required");
    }
    if (!stateManager) {
      this.log.error("constructor", "StateManager is required");
      throw new Error("EdgeManager: StateManager is required");
    }

    this.editor = editor;
    this.nodeManager = nodeManager;
    this.eventBus = eventBus;
    this.stateManager = stateManager; // ← StateManager (complete layer)

    this.log.info("constructor", "Dependencies validated");

    // Storage
    this.edges = new Map(); // edgeId -> EdgeModel
    this.edgesByNode = new Map(); // nodeId -> Set<edgeId>

    // Edge ID counter
    this.nextEdgeId = 1;

    // Setup event listeners
    this._setupEventListeners();

    this.log.info("constructor", "✓ EdgeManager initialized");
    this.log.exit("constructor");
  }

  /**
   * Setup event listeners
   *
   * @private
   */
  _setupEventListeners() {
    this.log.enter("_setupEventListeners");

    // Listen to node deletion - remove connected edges
    this.eventBus.on("node:deleted", ({ id: nodeId }) => {
      this.log.info(
        "_setupEventListeners",
        `Node '${nodeId}' deleted, removing edges`
      );
      this.removeEdgesForNode(nodeId);
    });

    // Listen to node movement - update edge paths
    this.eventBus.on("node:moved", ({ id: nodeId }) => {
      this.updateEdgesForNode(nodeId);
    });

    this.eventBus.on("node:resized", ({ id: nodeId }) => {
      this.updateEdgesForNode(nodeId);
    });

    this.log.info("_setupEventListeners", "✓ Event listeners registered");
    this.log.exit("_setupEventListeners");
  }

  /**
   * Create a new edge
   *
   * Two calling conventions:
   * 1. createEdge(sourceId, targetId, sourcePort, targetPort)
   * 2. createEdge(edgeDataObject)
   *
   * @param {string|Object} sourceIdOrData - Source node ID or complete edge data object
   * @param {string} targetId - Target node ID (if first param is sourceId)
   * @param {string} sourcePort - Source port ID (optional)
   * @param {string} targetPort - Target port ID (optional)
   * @returns {EdgeModel|null} Created edge model
   */
  createEdge(sourceIdOrData, targetId, sourcePort = null, targetPort = null) {
    this.log.enter("createEdge", {
      sourceIdOrData,
      targetId,
      sourcePort,
      targetPort,
    });

    try {
      let edgeData;

      // Handle two calling conventions
      if (typeof sourceIdOrData === "object") {
        // Convention 2: Single object parameter
        edgeData = sourceIdOrData;
        this.log.info("createEdge", "Using object parameter convention");
      } else {
        // Convention 1: Individual parameters
        edgeData = {
          sourceId: sourceIdOrData,
          targetId: targetId,
          sourcePort: sourcePort,
          targetPort: targetPort,
          type: "default",
          label: "",
          style: {},
          markers: {},
          data: {},
        };
        this.log.info("createEdge", "Using individual parameters convention");
      }

      // Validate source and target nodes exist
      if (!this.nodeManager.hasNode(edgeData.sourceId)) {
        this.log.error(
          "createEdge",
          `Source node '${edgeData.sourceId}' not found`
        );
        throw new Error(`Source node '${edgeData.sourceId}' does not exist`);
      }

      if (!this.nodeManager.hasNode(edgeData.targetId)) {
        this.log.error(
          "createEdge",
          `Target node '${edgeData.targetId}' not found`
        );
        throw new Error(`Target node '${edgeData.targetId}' does not exist`);
      }

      this.log.info("createEdge", "✓ Source and target nodes validated");

      // Generate edge ID if not provided
      const edgeId = edgeData.id || `edge_${this.nextEdgeId++}`;
      this.log.info("createEdge", `Generated edge ID: ${edgeId}`);

      // Create complete edge data
      const completeEdgeData = {
        id: edgeId,
        sourceId: edgeData.sourceId,
        targetId: edgeData.targetId,
        sourcePort: edgeData.sourcePort || null,
        targetPort: edgeData.targetPort || null,
        type: edgeData.type || "default",
        label: edgeData.label || "",
        style: {
          stroke: "#757575",
          strokeWidth: 2,
          ...edgeData.style,
        },
        data: edgeData.data || {},
        animated: edgeData.animated || false,
        markers: {
          start: (edgeData.markers && edgeData.markers.start) || null,
          end: (edgeData.markers && edgeData.markers.end) || "arrowhead",
        },
      };

      this.log.info("createEdge", "Complete edge data:", completeEdgeData);

      // Create EdgeModel
      this.log.info("createEdge", "Creating EdgeModel...");
      const edge = new EdgeModel(completeEdgeData);
      this.log.info("createEdge", `✓ EdgeModel created: ${edge.id}`);

      // Store edge
      this.edges.set(edge.id, edge);
      this._addEdgeToNodeTracking(edge.id, edge.sourceId, edge.targetId);
      this.log.info(
        "createEdge",
        `✓ Stored in maps (total edges: ${this.edges.size})`
      );

      // Add to state via StateManager
      this.log.info("createEdge", "Adding to StateManager...");

      const stateData = {
        id: edge.id,
        sourceId: edge.sourceId,
        targetId: edge.targetId,
        sourcePort: edge.sourcePort,
        targetPort: edge.targetPort,
        type: edge.type,
        label: edge.label,
        style: { ...edge.style },
        data: edge.metadata || {},
        animated: completeEdgeData.animated || false,
        markers: completeEdgeData.markers || { start: null, end: "arrowhead" },
      };

      // Add via StateManager (not EditorState!)
      this.stateManager.addEdge(edge.id, stateData);
      this.log.info("createEdge", "✓ Added to state via StateManager");

      // Render edge (simplified - you'll need to implement proper edge rendering)
      this.log.info("createEdge", "Rendering edge...");
      this._renderEdge(edge);
      this.log.info("createEdge", "✓ Edge rendered");

      // Emit event
      this.eventBus.emit("edge:created", {
        id: edge.id,
        sourceId: edge.sourceId,
        targetId: edge.targetId,
      });

      this.log.info("createEdge", `✅ Edge created successfully: ${edge.id}`);
      this.log.exit("createEdge");

      return edge.id;
    } catch (error) {
      this.log.error("createEdge", "❌ Failed to create edge");
      this.log.error("createEdge", `Error: ${error.message}`);
      this.log.error("createEdge", `Stack: ${error.stack}`);

      throw new Error(`EdgeManager.createEdge failed: ${error.message}`);
    }
  }

  /**
   * Get edge by ID
   */
  getEdge(edgeId) {
    return this.edges.get(edgeId);
  }

  /**
   * Get all edges
   */
  getAllEdges() {
    return Array.from(this.edges.values());
  }

  /**
   * Update edge properties
   */
  updateEdge(edgeId, updates) {
    this.log.enter("updateEdge", { edgeId, updates });

    const edge = this.edges.get(edgeId);
    if (!edge) {
      this.log.warn("updateEdge", `Edge '${edgeId}' not found`);
      this.log.exit("updateEdge");
      return;
    }

    // Update model
    Object.assign(edge, updates);
    this.log.info("updateEdge", "✓ Model updated");

    // Update state via StateManager
    this.stateManager.updateEdge(edgeId, updates);
    this.log.info("updateEdge", "✓ State updated via StateManager");

    // Re-render
    this._renderEdge(edge);
    this.log.info("updateEdge", "✓ Re-rendered");

    // Emit event
    this.eventBus.emit("edge:updated", { id: edgeId, updates });

    this.log.info("updateEdge", `✅ Edge updated: ${edgeId}`);
    this.log.exit("updateEdge");
  }

  /**
   * Delete an edge
   */
  deleteEdge(edgeId) {
    this.log.enter("deleteEdge", { edgeId });

    const edge = this.edges.get(edgeId);
    if (!edge) {
      this.log.warn("deleteEdge", `Edge '${edgeId}' not found`);
      this.log.exit("deleteEdge");
      return;
    }

    // Remove from tracking
    this._removeEdgeFromNodeTracking(edgeId, edge.sourceId, edge.targetId);

    // Remove from storage
    this.edges.delete(edgeId);
    this.log.info("deleteEdge", "✓ Removed from maps");

    // Remove from state via StateManager
    this.stateManager.removeEdge(edgeId);
    this.log.info("deleteEdge", "✓ Removed from state via StateManager");

    // Remove from canvas
    this.editor.removeEdgeElement(edgeId);
    this.log.info("deleteEdge", "✓ Removed from canvas");

    // Emit event
    this.eventBus.emit("edge:deleted", { id: edgeId });

    this.log.info("deleteEdge", `✅ Edge deleted: ${edgeId}`);
    this.log.exit("deleteEdge");
  }

  /**
   * Get edges for a specific node
   */
  getEdgesForNode(nodeId) {
    const edgeIds = this.edgesByNode.get(nodeId);
    if (!edgeIds) return [];

    return Array.from(edgeIds)
      .map((edgeId) => this.edges.get(edgeId))
      .filter((edge) => edge !== undefined);
  }

  /**
   * Get incoming edges for a node
   */
  getIncomingEdges(nodeId) {
    return this.getEdgesForNode(nodeId).filter(
      (edge) => edge.targetId === nodeId
    );
  }

  /**
   * Get outgoing edges for a node
   */
  getOutgoingEdges(nodeId) {
    return this.getEdgesForNode(nodeId).filter(
      (edge) => edge.sourceId === nodeId
    );
  }

  /**
   * Remove all edges for a node
   */
  removeEdgesForNode(nodeId) {
    this.log.enter("removeEdgesForNode", { nodeId });

    const edges = this.getEdgesForNode(nodeId);
    const edgeIds = edges.map((edge) => edge.id);

    edgeIds.forEach((edgeId) => this.deleteEdge(edgeId));

    this.log.info(
      "removeEdgesForNode",
      `✅ Removed ${edgeIds.length} edges for node '${nodeId}'`
    );
    this.log.exit("removeEdgesForNode");
  }

  /**
   * Update edges for a node (when node moves/resizes)
   */
  updateEdgesForNode(nodeId) {
    this.log.enter("updateEdgesForNode", { nodeId });

    const edges = this.getEdgesForNode(nodeId);

    edges.forEach((edge) => {
      this._renderEdge(edge);
    });

    this.log.info(
      "updateEdgesForNode",
      `✓ Updated ${edges.length} edges for node '${nodeId}'`
    );
    this.log.exit("updateEdgesForNode");
  }

  /**
   * Update node edges (alias for updateEdgesForNode)
   */
  updateNodeEdges(nodeId) {
    this.updateEdgesForNode(nodeId);
  }

  /**
   * Remove node edges (alias for removeEdgesForNode)
   */
  removeNodeEdges(nodeId) {
    this.removeEdgesForNode(nodeId);
  }

  /**
   * Clear all edges
   */
  clearAll() {
    this.log.enter("clearAll");

    const edgeIds = Array.from(this.edges.keys());
    edgeIds.forEach((edgeId) => this.deleteEdge(edgeId));

    this.log.info("clearAll", "✅ All edges cleared");
    this.log.exit("clearAll");
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      total: this.edges.size,
      byType: this._getEdgesByType(),
      animated: Array.from(this.edges.values()).filter((e) => e.animated)
        .length,
    };
  }

  /**
   * Get edge count
   */
  getEdgeCount() {
    return this.edges.size;
  }

  /**
   * Print debug info
   */
  printDebugInfo() {
    const stats = this.getStats();
    console.log("========== EdgeManager Debug Info ==========");
    console.log(`Total edges: ${stats.total}`);
    console.log(`Animated: ${stats.animated}`);
    console.log("By type:");
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    console.log("=".repeat(44));
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Add edge to node tracking
   *
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
   *
   * @private
   */
  _removeEdgeFromNodeTracking(edgeId, sourceId, targetId) {
    // Remove from source node
    const sourceEdges = this.edgesByNode.get(sourceId);
    if (sourceEdges) {
      sourceEdges.delete(edgeId);
      if (sourceEdges.size === 0) {
        this.edgesByNode.delete(sourceId);
      }
    }

    // Remove from target node
    const targetEdges = this.edgesByNode.get(targetId);
    if (targetEdges) {
      targetEdges.delete(edgeId);
      if (targetEdges.size === 0) {
        this.edgesByNode.delete(targetId);
      }
    }
  }

  /**
   * Render an edge to canvas
   *
   * @private
   */
  _renderEdge(edge) {
    // Get source and target node bounds
    const sourceBounds = this.nodeManager.getNodeBounds(edge.sourceId);
    const targetBounds = this.nodeManager.getNodeBounds(edge.targetId);

    if (!sourceBounds || !targetBounds) {
      this.log.warn(
        "_renderEdge",
        `Cannot render edge '${edge.id}': node bounds not found`
      );
      return;
    }

    // Calculate edge path
    const path = this._calculateEdgePath(edge, sourceBounds, targetBounds);

    // Create or update SVG path element
    const edgeElement = this._createEdgeElement(edge, path);

    // Add/update in canvas
    this.editor.addEdgeElement(edge.id, edgeElement);
  }

  /**
   * Calculate edge path
   *
   * @private
   */
  _calculateEdgePath(edge, sourceBounds, targetBounds) {
    // Simple straight line for now
    // You can implement curved paths, orthogonal routing, etc.
    const startX = sourceBounds.centerX;
    const startY = sourceBounds.centerY;
    const endX = targetBounds.centerX;
    const endY = targetBounds.centerY;

    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }

  /**
   * Create edge SVG element
   *
   * @private
   */
  _createEdgeElement(edge, pathData) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("data-edge-id", edge.id);
    g.setAttribute("class", "edge");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("stroke", edge.style.stroke);
    path.setAttribute("stroke-width", edge.style.strokeWidth);
    path.setAttribute("fill", "none");

    if (edge.markers.end) {
      path.setAttribute("marker-end", `url(#${edge.markers.end})`);
    }

    if (edge.animated) {
      path.setAttribute("class", "edge-animated");
    }

    g.appendChild(path);

    // Add label if present
    if (edge.label) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      const pathLength = path.getTotalLength();
      const midPoint = path.getPointAtLength(pathLength / 2);

      text.setAttribute("x", midPoint.x);
      text.setAttribute("y", midPoint.y - 5);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("class", "edge-label");
      text.textContent = edge.label;

      g.appendChild(text);
    }

    return g;
  }

  /**
   * Get edges grouped by type
   *
   * @private
   */
  _getEdgesByType() {
    const byType = {};
    for (const edge of this.edges.values()) {
      byType[edge.type] = (byType[edge.type] || 0) + 1;
    }
    return byType;
  }
}
