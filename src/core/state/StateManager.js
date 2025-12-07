/**
 * StateManager.js - Complete State Management Layer
 *
 * High-level API that DIRECTLY manipulates EditorState data structures.
 * No redundant methods - works directly on EditorState.state.graph.nodes/edges.
 *
 * ARCHITECTURE:
 * - EditorState = Low-level storage (Maps, Sets, objects)
 * - StateManager = High-level API (directly manipulates EditorState data)
 *
 * @module core/state/StateManager
 * @version 4.0.0 - Direct Data Manipulation
 */

import { DebugLogger } from "../../utils/debug/DebugLogger.js";

export class StateManager {
  /**
   * Create StateManager
   *
   * @param {EditorState} editorState - The underlying state store
   */
  constructor(editorState) {
    this.log = new DebugLogger("StateManager", "#9C27B0");
    this.log.enter("constructor");

    if (!editorState) {
      this.log.error("constructor", "EditorState is required");
      throw new Error("StateManager: EditorState is required");
    }

    this.editorState = editorState;
    this.log.info("constructor", "EditorState attached");

    // Get direct references to data structures
    this.nodes = this.editorState.getNodesMap(); // Map<nodeId, nodeData>
    this.edges = this.editorState.getEdgesMap(); // Map<edgeId, edgeData>
    this.selection = this.editorState.getSelectionSets(); // {nodeIds: Set, edgeIds: Set}

    // Query cache for computed values
    this.queryCache = new Map();

    // Setup cache invalidation
    this._setupCacheInvalidation();

    this.log.info(
      "constructor",
      "✓ StateManager initialized (Direct Manipulation)"
    );
    this.log.exit("constructor");
  }

  // ============================================================================
  // CRUD OPERATIONS - NODES (Direct Map Manipulation)
  // ============================================================================

  /**
   * Add a node to the graph
   *
   * @param {string} nodeId - Node identifier
   * @param {Object} nodeData - Node data
   * @param {Object} options - Options {silent: boolean}
   * @returns {boolean} Success
   */
  addNode(nodeId, nodeData, options = {}) {
    this.log.enter("addNode", { nodeId });

    try {
      // Directly add to Map
      this.nodes.set(nodeId, nodeData);

      this._invalidateCache();

      // Emit event via EditorState
      if (!options.silent) {
        this.editorState.emitChange("node-added", { nodeId, nodeData });
      }

      this.log.info("addNode", `✓ Node '${nodeId}' added to Map`);
      this.log.exit("addNode", true);
      return true;
    } catch (error) {
      this.log.error("addNode", `Failed: ${error.message}`);
      this.log.exit("addNode", false);
      return false;
    }
  }

  /**
   * Remove a node from the graph
   *
   * @param {string} nodeId - Node identifier
   * @param {Object} options - Options {silent: boolean}
   * @returns {boolean} Success
   */
  removeNode(nodeId, options = {}) {
    this.log.enter("removeNode", { nodeId });

    try {
      // Get node data before removal
      const nodeData = this.nodes.get(nodeId);

      if (!nodeData) {
        this.log.warn("removeNode", `Node '${nodeId}' not found`);
        return false;
      }

      // Directly remove from Map
      this.nodes.delete(nodeId);

      // Remove from selection if selected
      this.selection.nodeIds.delete(nodeId);

      this._invalidateCache();

      // Emit event via EditorState
      if (!options.silent) {
        this.editorState.emitChange("node-removed", { nodeId });
      }

      this.log.info("removeNode", `✓ Node '${nodeId}' removed from Map`);
      this.log.exit("removeNode", true);
      return true;
    } catch (error) {
      this.log.error("removeNode", `Failed: ${error.message}`);
      this.log.exit("removeNode", false);
      return false;
    }
  }

  /**
   * Update a node's properties
   *
   * @param {string} nodeId - Node identifier
   * @param {Object} updates - Properties to update
   * @param {Object} options - Options {silent: boolean}
   * @returns {boolean} Success
   */
  updateNode(nodeId, updates, options = {}) {
    this.log.enter("updateNode", { nodeId, updates });

    try {
      const nodeData = this.nodes.get(nodeId);

      if (!nodeData) {
        this.log.warn("updateNode", `Node '${nodeId}' not found`);
        return false;
      }

      // Directly update object in Map
      Object.assign(nodeData, updates);

      this._invalidateCache();

      // Emit event via EditorState
      if (!options.silent) {
        this.editorState.emitChange("node-updated", { nodeId, updates });
      }

      this.log.info("updateNode", `✓ Node '${nodeId}' updated in Map`);
      this.log.exit("updateNode", true);
      return true;
    } catch (error) {
      this.log.error("updateNode", `Failed: ${error.message}`);
      this.log.exit("updateNode", false);
      return false;
    }
  }

  /**
   * Get a node by ID
   *
   * @param {string} nodeId - Node identifier
   * @returns {Object|null} Node data or null
   */
  getNode(nodeId) {
    return this.nodes.get(nodeId) || null;
  }

  /**
   * Get all nodes
   *
   * @returns {Array<Object>} Array of node data objects
   */
  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  /**
   * Check if a node exists
   *
   * @param {string} nodeId - Node identifier
   * @returns {boolean}
   */
  hasNode(nodeId) {
    return this.nodes.has(nodeId);
  }

  /**
   * Get node count
   *
   * @returns {number}
   */
  getNodeCount() {
    return this.nodes.size;
  }

  // ============================================================================
  // CRUD OPERATIONS - EDGES (Direct Map Manipulation)
  // ============================================================================

  /**
   * Add an edge to the graph
   *
   * @param {string} edgeId - Edge identifier
   * @param {Object} edgeData - Edge data
   * @param {Object} options - Options {silent: boolean}
   * @returns {boolean} Success
   */
  addEdge(edgeId, edgeData, options = {}) {
    this.log.enter("addEdge", { edgeId });

    try {
      // Directly add to Map
      this.edges.set(edgeId, edgeData);

      this._invalidateCache();

      // Emit event via EditorState
      if (!options.silent) {
        this.editorState.emitChange("edge-added", { edgeId, edgeData });
      }

      this.log.info("addEdge", `✓ Edge '${edgeId}' added to Map`);
      this.log.exit("addEdge", true);
      return true;
    } catch (error) {
      this.log.error("addEdge", `Failed: ${error.message}`);
      this.log.exit("addEdge", false);
      return false;
    }
  }

  /**
   * Remove an edge from the graph
   *
   * @param {string} edgeId - Edge identifier
   * @param {Object} options - Options {silent: boolean}
   * @returns {boolean} Success
   */
  removeEdge(edgeId, options = {}) {
    this.log.enter("removeEdge", { edgeId });

    try {
      const edgeData = this.edges.get(edgeId);

      if (!edgeData) {
        this.log.warn("removeEdge", `Edge '${edgeId}' not found`);
        return false;
      }

      // Directly remove from Map
      this.edges.delete(edgeId);

      // Remove from selection if selected
      this.selection.edgeIds.delete(edgeId);

      this._invalidateCache();

      // Emit event via EditorState
      if (!options.silent) {
        this.editorState.emitChange("edge-removed", { edgeId });
      }

      this.log.info("removeEdge", `✓ Edge '${edgeId}' removed from Map`);
      this.log.exit("removeEdge", true);
      return true;
    } catch (error) {
      this.log.error("removeEdge", `Failed: ${error.message}`);
      this.log.exit("removeEdge", false);
      return false;
    }
  }

  /**
   * Update an edge's properties
   *
   * @param {string} edgeId - Edge identifier
   * @param {Object} updates - Properties to update
   * @param {Object} options - Options {silent: boolean}
   * @returns {boolean} Success
   */
  updateEdge(edgeId, updates, options = {}) {
    this.log.enter("updateEdge", { edgeId, updates });

    try {
      const edgeData = this.edges.get(edgeId);

      if (!edgeData) {
        this.log.warn("updateEdge", `Edge '${edgeId}' not found`);
        return false;
      }

      // Directly update object in Map
      Object.assign(edgeData, updates);

      this._invalidateCache();

      // Emit event via EditorState
      if (!options.silent) {
        this.editorState.emitChange("edge-updated", { edgeId, updates });
      }

      this.log.info("updateEdge", `✓ Edge '${edgeId}' updated in Map`);
      this.log.exit("updateEdge", true);
      return true;
    } catch (error) {
      this.log.error("updateEdge", `Failed: ${error.message}`);
      this.log.exit("updateEdge", false);
      return false;
    }
  }

  /**
   * Get an edge by ID
   *
   * @param {string} edgeId - Edge identifier
   * @returns {Object|null} Edge data or null
   */
  getEdge(edgeId) {
    return this.edges.get(edgeId) || null;
  }

  /**
   * Get all edges
   *
   * @returns {Array<Object>} Array of edge data objects
   */
  getAllEdges() {
    return Array.from(this.edges.values());
  }

  /**
   * Check if an edge exists
   *
   * @param {string} edgeId - Edge identifier
   * @returns {boolean}
   */
  hasEdge(edgeId) {
    return this.edges.has(edgeId);
  }

  /**
   * Get edge count
   *
   * @returns {number}
   */
  getEdgeCount() {
    return this.edges.size;
  }

  /**
   * Get edges connected to a node
   *
   * @param {string} nodeId - Node identifier
   * @returns {Array<Object>} Array of edge data objects
   */
  getEdgesForNode(nodeId) {
    const cacheKey = `edges_for_node_${nodeId}`;

    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey);
    }

    const edges = this.getAllEdges().filter(
      (edge) => edge.sourceId === nodeId || edge.targetId === nodeId
    );

    this.queryCache.set(cacheKey, edges);
    return edges;
  }

  /**
   * Get incoming edges for a node
   *
   * @param {string} nodeId - Node identifier
   * @returns {Array<Object>} Array of edge data objects
   */
  getIncomingEdges(nodeId) {
    return this.getAllEdges().filter((edge) => edge.targetId === nodeId);
  }

  /**
   * Get outgoing edges for a node
   *
   * @param {string} nodeId - Node identifier
   * @returns {Array<Object>} Array of edge data objects
   */
  getOutgoingEdges(nodeId) {
    return this.getAllEdges().filter((edge) => edge.sourceId === nodeId);
  }

  // ============================================================================
  // SELECTION OPERATIONS (Direct Set Manipulation)
  // ============================================================================

  /**
   * Select a single node
   *
   * @param {string} nodeId - Node identifier
   * @param {Object} options - Options {silent: boolean}
   */
  selectNode(nodeId, options = {}) {
    this.log.enter("selectNode", { nodeId });

    // Directly manipulate Sets
    this.selection.nodeIds.clear();
    this.selection.edgeIds.clear();
    this.selection.nodeIds.add(nodeId);

    // Emit event
    if (!options.silent) {
      this.editorState.emitChange("selection-changed", {
        nodeIds: [nodeId],
        edgeIds: [],
      });
    }

    this.log.info("selectNode", `✓ Node '${nodeId}' selected`);
    this.log.exit("selectNode");
  }

  /**
   * Select multiple nodes
   *
   * @param {Array<string>} nodeIds - Array of node identifiers
   * @param {Object} options - Options {silent: boolean}
   */
  selectNodes(nodeIds, options = {}) {
    this.log.enter("selectNodes", { count: nodeIds.length });

    // Directly manipulate Sets
    this.selection.nodeIds.clear();
    this.selection.edgeIds.clear();
    nodeIds.forEach((id) => this.selection.nodeIds.add(id));

    // Emit event
    if (!options.silent) {
      this.editorState.emitChange("selection-changed", {
        nodeIds: [...nodeIds],
        edgeIds: [],
      });
    }

    this.log.info("selectNodes", `✓ ${nodeIds.length} nodes selected`);
    this.log.exit("selectNodes");
  }

  /**
   * Add a node to current selection
   *
   * @param {string} nodeId - Node identifier
   * @param {Object} options - Options {silent: boolean}
   */
  addNodeToSelection(nodeId, options = {}) {
    this.log.enter("addNodeToSelection", { nodeId });

    // Directly add to Set
    this.selection.nodeIds.add(nodeId);

    // Emit event
    if (!options.silent) {
      this.editorState.emitChange("selection-changed", {
        nodeIds: Array.from(this.selection.nodeIds),
        edgeIds: Array.from(this.selection.edgeIds),
      });
    }

    this.log.info(
      "addNodeToSelection",
      `✓ Node '${nodeId}' added to selection`
    );
    this.log.exit("addNodeToSelection");
  }

  /**
   * Remove a node from current selection
   *
   * @param {string} nodeId - Node identifier
   * @param {Object} options - Options {silent: boolean}
   */
  removeNodeFromSelection(nodeId, options = {}) {
    this.log.enter("removeNodeFromSelection", { nodeId });

    // Directly remove from Set
    this.selection.nodeIds.delete(nodeId);

    // Emit event
    if (!options.silent) {
      this.editorState.emitChange("selection-changed", {
        nodeIds: Array.from(this.selection.nodeIds),
        edgeIds: Array.from(this.selection.edgeIds),
      });
    }

    this.log.info(
      "removeNodeFromSelection",
      `✓ Node '${nodeId}' removed from selection`
    );
    this.log.exit("removeNodeFromSelection");
  }

  /**
   * Toggle node selection
   *
   * @param {string} nodeId - Node identifier
   * @param {Object} options - Options {silent: boolean}
   */
  toggleNodeSelection(nodeId, options = {}) {
    if (this.selection.nodeIds.has(nodeId)) {
      this.removeNodeFromSelection(nodeId, options);
    } else {
      this.addNodeToSelection(nodeId, options);
    }
  }

  /**
   * Select a single edge
   *
   * @param {string} edgeId - Edge identifier
   * @param {Object} options - Options {silent: boolean}
   */
  selectEdge(edgeId, options = {}) {
    this.log.enter("selectEdge", { edgeId });

    // Directly manipulate Sets
    this.selection.nodeIds.clear();
    this.selection.edgeIds.clear();
    this.selection.edgeIds.add(edgeId);

    // Emit event
    if (!options.silent) {
      this.editorState.emitChange("selection-changed", {
        nodeIds: [],
        edgeIds: [edgeId],
      });
    }

    this.log.info("selectEdge", `✓ Edge '${edgeId}' selected`);
    this.log.exit("selectEdge");
  }

  /**
   * Get current selection
   *
   * @returns {Object} {nodeIds: Array, edgeIds: Array}
   */
  getSelection() {
    return {
      nodeIds: Array.from(this.selection.nodeIds),
      edgeIds: Array.from(this.selection.edgeIds),
    };
  }

  /**
   * Get selected node IDs
   *
   * @returns {Array<string>}
   */
  getSelectedNodeIds() {
    return Array.from(this.selection.nodeIds);
  }

  /**
   * Get selected edge IDs
   *
   * @returns {Array<string>}
   */
  getSelectedEdgeIds() {
    return Array.from(this.selection.edgeIds);
  }

  /**
   * Check if a node is selected
   *
   * @param {string} nodeId - Node identifier
   * @returns {boolean}
   */
  isNodeSelected(nodeId) {
    return this.selection.nodeIds.has(nodeId);
  }

  /**
   * Clear selection
   *
   * @param {Object} options - Options {silent: boolean}
   */
  clearSelection(options = {}) {
    this.log.enter("clearSelection");

    // Directly clear Sets
    this.selection.nodeIds.clear();
    this.selection.edgeIds.clear();

    // Emit event
    if (!options.silent) {
      this.editorState.emitChange("selection-changed", {
        nodeIds: [],
        edgeIds: [],
      });
    }

    this.log.info("clearSelection", "✓ Selection cleared");
    this.log.exit("clearSelection");
  }

  /**
   * Select all nodes
   *
   * @param {Object} options - Options {silent: boolean}
   */
  selectAll(options = {}) {
    this.log.enter("selectAll");

    const allNodeIds = Array.from(this.nodes.keys());

    // Directly manipulate Sets
    this.selection.nodeIds.clear();
    this.selection.edgeIds.clear();
    allNodeIds.forEach((id) => this.selection.nodeIds.add(id));

    // Emit event
    if (!options.silent) {
      this.editorState.emitChange("selection-changed", {
        nodeIds: allNodeIds,
        edgeIds: [],
      });
    }

    this.log.info("selectAll", `✓ All ${allNodeIds.length} nodes selected`);
    this.log.exit("selectAll");
  }

  // ============================================================================
  // CANVAS OPERATIONS (Use EditorState.set())
  // ============================================================================

  /**
   * Set zoom level
   */
  setZoom(zoomLevel, options = {}) {
    const clampedZoom = Math.max(0.1, Math.min(5.0, zoomLevel));
    this.editorState.set("canvas.zoom", clampedZoom, options);
    this.log.info(
      "setZoom",
      `✓ Zoom set to ${(clampedZoom * 100).toFixed(0)}%`
    );
  }

  /**
   * Get current zoom level
   */
  getZoom() {
    return this.editorState.get("canvas.zoom", 1.0);
  }

  /**
   * Zoom in
   */
  zoomIn(factor = 1.1, options = {}) {
    this.setZoom(this.getZoom() * factor, options);
  }

  /**
   * Zoom out
   */
  zoomOut(factor = 0.9, options = {}) {
    this.setZoom(this.getZoom() * factor, options);
  }

  /**
   * Reset zoom to 100%
   */
  resetZoom(options = {}) {
    this.setZoom(1.0, options);
  }

  /**
   * Set pan position
   */
  setPan(x, y, options = {}) {
    this.editorState.update({ "canvas.panX": x, "canvas.panY": y }, options);
  }

  /**
   * Get current pan position
   */
  getPan() {
    return {
      x: this.editorState.get("canvas.panX", 0),
      y: this.editorState.get("canvas.panY", 0),
    };
  }

  /**
   * Pan by delta
   */
  panBy(deltaX, deltaY, options = {}) {
    const current = this.getPan();
    this.setPan(current.x + deltaX, current.y + deltaY, options);
  }

  /**
   * Reset pan to center
   */
  resetPan(options = {}) {
    this.setPan(0, 0, options);
  }

  /**
   * Set canvas size
   */
  setCanvasSize(width, height, options = {}) {
    this.editorState.update(
      { "canvas.width": width, "canvas.height": height },
      options
    );
  }

  /**
   * Get canvas size
   */
  getCanvasSize() {
    return {
      width: this.editorState.get("canvas.width", 800),
      height: this.editorState.get("canvas.height", 600),
    };
  }

  // ============================================================================
  // VIEWPORT OPERATIONS
  // ============================================================================

  setViewportMode(mode, options = {}) {
    this.editorState.set("viewport.mode", mode, options);
  }

  getViewportMode() {
    return this.editorState.get("viewport.mode", "default");
  }

  setDragging(isDragging, startX = 0, startY = 0, options = {}) {
    this.editorState.update(
      {
        "viewport.isDragging": isDragging,
        "viewport.dragStartX": startX,
        "viewport.dragStartY": startY,
      },
      options
    );
  }

  getDragging() {
    return {
      isDragging: this.editorState.get("viewport.isDragging", false),
      dragStartX: this.editorState.get("viewport.dragStartX", 0),
      dragStartY: this.editorState.get("viewport.dragStartY", 0),
    };
  }

  // ============================================================================
  // THEME OPERATIONS
  // ============================================================================

  setTheme(themeName, options = {}) {
    this.editorState.set("theme.name", themeName, options);
  }

  getTheme() {
    return this.editorState.get("theme.name", "light");
  }

  setAccentColor(color, options = {}) {
    this.editorState.set("theme.accentColor", color, options);
  }

  getAccentColor() {
    return this.editorState.get("theme.accentColor", "#1976d2");
  }

  // ============================================================================
  // UI OPERATIONS
  // ============================================================================

  setActivePanel(panelName, options = {}) {
    this.editorState.set("ui.activePanel", panelName, options);
  }

  getActivePanel() {
    return this.editorState.get("ui.activePanel", null);
  }

  toggleGrid(options = {}) {
    const current = this.editorState.get("ui.showGrid", true);
    this.editorState.set("ui.showGrid", !current, options);
  }

  toggleGuides(options = {}) {
    const current = this.editorState.get("ui.showGuides", true);
    this.editorState.set("ui.showGuides", !current, options);
  }

  toggleSnapToGrid(options = {}) {
    const current = this.editorState.get("ui.snapToGrid", false);
    this.editorState.set("ui.snapToGrid", !current, options);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getSummary() {
    const selection = this.getSelection();
    const zoom = this.getZoom();
    const pan = this.getPan();
    const theme = this.getTheme();

    return {
      graph: { nodes: this.nodes.size, edges: this.edges.size },
      selection: {
        nodes: selection.nodeIds.length,
        edges: selection.edgeIds.length,
      },
      canvas: {
        zoom: (zoom * 100).toFixed(0) + "%",
        pan: `(${pan.x.toFixed(0)}, ${pan.y.toFixed(0)})`,
      },
      theme,
    };
  }

  printSummary() {
    const summary = this.getSummary();
    console.log("========== StateManager Summary ==========");
    console.log(
      `Graph: ${summary.graph.nodes} nodes, ${summary.graph.edges} edges`
    );
    console.log(
      `Selection: ${summary.selection.nodes} nodes, ${summary.selection.edges} edges`
    );
    console.log(
      `Canvas: Zoom ${summary.canvas.zoom}, Pan ${summary.canvas.pan}`
    );
    console.log(`Theme: ${summary.theme}`);
    console.log("=".repeat(42));
  }

  getRawState() {
    return this.editorState.getSnapshot();
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  _setupCacheInvalidation() {
    this.editorState.eventBus.on("state:changed", () => {
      this._invalidateCache();
    });
  }

  _invalidateCache() {
    this.queryCache.clear();
  }
}
