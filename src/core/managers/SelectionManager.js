/**
 * SelectionManager.js - Manages selection state for nodes and edges
 *
 * Responsibilities:
 * - Track selected nodes and edges
 * - Handle single and multi-selection
 * - Manage selection boxes and highlight rendering
 * - Emit selection change events
 * - Support selection filtering and queries
 *
 * @module core/managers/SelectionManager
 */

export class SelectionManager {
  constructor(eventBus, stateManager) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;

    // Selection storage
    this.selectedNodes = new Set();
    this.selectedEdges = new Set();
    this.lastSelected = null; // For Shift+Click range selection
    this.selectionBox = null; // For drag selection

    // Selection mode
    this.mode = "replace"; // 'replace', 'add', 'toggle', 'subtract'

    this._setupEventListeners();
  }

  /**
   * Setup event listeners for selection changes
   * @private
   */
  _setupEventListeners() {
    // Listen for node deletion to remove from selection
    this.eventBus.on("node:deleted", ({ nodeId }) => {
      this.deselectNode(nodeId);
    });

    // Listen for edge deletion
    this.eventBus.on("edge:deleted", ({ edgeId }) => {
      this.deselectEdge(edgeId);
    });

    // Listen for clear canvas
    this.eventBus.on("canvas:cleared", () => {
      this.clearSelection();
    });
  }

  /**
   * Select a single node
   * @param {string} nodeId - Node to select
   * @param {Object} options - Selection options
   */
  selectNode(nodeId, options = {}) {
    const { mode = this.mode, emit = true, focus = false } = options;

    const previousSelection = new Set(this.selectedNodes);

    switch (mode) {
      case "replace":
        this.selectedNodes.clear();
        this.selectedEdges.clear();
        this.selectedNodes.add(nodeId);
        break;

      case "add":
        this.selectedNodes.add(nodeId);
        break;

      case "toggle":
        if (this.selectedNodes.has(nodeId)) {
          this.selectedNodes.delete(nodeId);
        } else {
          this.selectedNodes.add(nodeId);
        }
        break;

      case "subtract":
        this.selectedNodes.delete(nodeId);
        break;
    }

    this.lastSelected = { type: "node", id: nodeId };

    // Update state
    this.stateManager.setState(
      "selection.nodes",
      Array.from(this.selectedNodes)
    );

    if (emit) {
      this.eventBus.emit("selection:changed", {
        nodes: Array.from(this.selectedNodes),
        edges: Array.from(this.selectedEdges),
        added: this._getDifference(this.selectedNodes, previousSelection),
        removed: this._getDifference(previousSelection, this.selectedNodes),
      });

      this.eventBus.emit("node:selected", { nodeId, mode });
    }

    if (focus) {
      this.eventBus.emit("node:focus", { nodeId });
    }
  }

  /**
   * Select a single edge
   * @param {string} edgeId - Edge to select
   * @param {Object} options - Selection options
   */
  selectEdge(edgeId, options = {}) {
    const { mode = this.mode, emit = true } = options;

    const previousSelection = new Set(this.selectedEdges);

    switch (mode) {
      case "replace":
        this.selectedNodes.clear();
        this.selectedEdges.clear();
        this.selectedEdges.add(edgeId);
        break;

      case "add":
        this.selectedEdges.add(edgeId);
        break;

      case "toggle":
        if (this.selectedEdges.has(edgeId)) {
          this.selectedEdges.delete(edgeId);
        } else {
          this.selectedEdges.add(edgeId);
        }
        break;

      case "subtract":
        this.selectedEdges.delete(edgeId);
        break;
    }

    this.lastSelected = { type: "edge", id: edgeId };

    // Update state
    this.stateManager.setState(
      "selection.edges",
      Array.from(this.selectedEdges)
    );

    if (emit) {
      this.eventBus.emit("selection:changed", {
        nodes: Array.from(this.selectedNodes),
        edges: Array.from(this.selectedEdges),
        added: this._getDifference(this.selectedEdges, previousSelection),
        removed: this._getDifference(previousSelection, this.selectedEdges),
      });

      this.eventBus.emit("edge:selected", { edgeId, mode });
    }
  }

  /**
   * Select multiple nodes at once
   * @param {string[]} nodeIds - Array of node IDs
   * @param {Object} options - Selection options
   */
  selectNodes(nodeIds, options = {}) {
    const { mode = "replace", emit = true } = options;

    if (mode === "replace") {
      this.selectedNodes.clear();
      this.selectedEdges.clear();
    }

    nodeIds.forEach((id) => this.selectedNodes.add(id));

    // Update state
    this.stateManager.setState(
      "selection.nodes",
      Array.from(this.selectedNodes)
    );

    if (emit) {
      this.eventBus.emit("selection:changed", {
        nodes: Array.from(this.selectedNodes),
        edges: Array.from(this.selectedEdges),
      });
    }
  }

  /**
   * Select multiple edges at once
   * @param {string[]} edgeIds - Array of edge IDs
   * @param {Object} options - Selection options
   */
  selectEdges(edgeIds, options = {}) {
    const { mode = "replace", emit = true } = options;

    if (mode === "replace") {
      this.selectedNodes.clear();
      this.selectedEdges.clear();
    }

    edgeIds.forEach((id) => this.selectedEdges.add(id));

    // Update state
    this.stateManager.setState(
      "selection.edges",
      Array.from(this.selectedEdges)
    );

    if (emit) {
      this.eventBus.emit("selection:changed", {
        nodes: Array.from(this.selectedNodes),
        edges: Array.from(this.selectedEdges),
      });
    }
  }

  /**
   * Deselect a specific node
   * @param {string} nodeId - Node to deselect
   */
  deselectNode(nodeId) {
    if (this.selectedNodes.has(nodeId)) {
      this.selectedNodes.delete(nodeId);
      this.stateManager.setState(
        "selection.nodes",
        Array.from(this.selectedNodes)
      );

      this.eventBus.emit("node:deselected", { nodeId });
      this.eventBus.emit("selection:changed", {
        nodes: Array.from(this.selectedNodes),
        edges: Array.from(this.selectedEdges),
      });
    }
  }

  /**
   * Deselect a specific edge
   * @param {string} edgeId - Edge to deselect
   */
  deselectEdge(edgeId) {
    if (this.selectedEdges.has(edgeId)) {
      this.selectedEdges.delete(edgeId);
      this.stateManager.setState(
        "selection.edges",
        Array.from(this.selectedEdges)
      );

      this.eventBus.emit("edge:deselected", { edgeId });
      this.eventBus.emit("selection:changed", {
        nodes: Array.from(this.selectedNodes),
        edges: Array.from(this.selectedEdges),
      });
    }
  }

  /**
   * Clear all selections
   * @param {boolean} emit - Whether to emit events
   */
  clearSelection(emit = true) {
    const hadSelection =
      this.selectedNodes.size > 0 || this.selectedEdges.size > 0;

    this.selectedNodes.clear();
    this.selectedEdges.clear();
    this.lastSelected = null;

    // Update state
    this.stateManager.setState("selection.nodes", []);
    this.stateManager.setState("selection.edges", []);

    if (emit && hadSelection) {
      this.eventBus.emit("selection:cleared");
      this.eventBus.emit("selection:changed", {
        nodes: [],
        edges: [],
      });
    }
  }

  /**
   * Select all nodes
   * @param {string[]} allNodeIds - All available node IDs
   */
  selectAll(allNodeIds) {
    this.selectNodes(allNodeIds, { mode: "replace" });
  }

  /**
   * Invert current selection
   * @param {string[]} allNodeIds - All available node IDs
   * @param {string[]} allEdgeIds - All available edge IDs
   */
  invertSelection(allNodeIds, allEdgeIds) {
    const currentNodes = new Set(this.selectedNodes);
    const currentEdges = new Set(this.selectedEdges);

    this.selectedNodes.clear();
    this.selectedEdges.clear();

    // Add unselected nodes
    allNodeIds.forEach((id) => {
      if (!currentNodes.has(id)) {
        this.selectedNodes.add(id);
      }
    });

    // Add unselected edges
    allEdgeIds.forEach((id) => {
      if (!currentEdges.has(id)) {
        this.selectedEdges.add(id);
      }
    });

    this.stateManager.setState(
      "selection.nodes",
      Array.from(this.selectedNodes)
    );
    this.stateManager.setState(
      "selection.edges",
      Array.from(this.selectedEdges)
    );

    this.eventBus.emit("selection:changed", {
      nodes: Array.from(this.selectedNodes),
      edges: Array.from(this.selectedEdges),
    });
  }

  /**
   * Select nodes within a rectangular area
   * @param {Object} rect - Selection rectangle {x, y, width, height}
   * @param {Function} getNodeBounds - Function to get node bounds
   */
  selectInRect(rect, getNodeBounds) {
    const nodesInRect = [];

    // This would typically iterate through all nodes
    // and check if they intersect with the rectangle
    // For now, this is a placeholder that would be called by the canvas

    this.selectNodes(nodesInRect, { mode: "replace" });

    return nodesInRect;
  }

  /**
   * Check if a node is selected
   * @param {string} nodeId - Node ID to check
   * @returns {boolean}
   */
  isNodeSelected(nodeId) {
    return this.selectedNodes.has(nodeId);
  }

  /**
   * Check if an edge is selected
   * @param {string} edgeId - Edge ID to check
   * @returns {boolean}
   */
  isEdgeSelected(edgeId) {
    return this.selectedEdges.has(edgeId);
  }

  /**
   * Get all selected node IDs
   * @returns {string[]}
   */
  getSelectedNodes() {
    return Array.from(this.selectedNodes);
  }

  /**
   * Get all selected edge IDs
   * @returns {string[]}
   */
  getSelectedEdges() {
    return Array.from(this.selectedEdges);
  }

  /**
   * Get all selected items (nodes and edges)
   * @returns {Object}
   */
  getSelection() {
    return {
      nodes: Array.from(this.selectedNodes),
      edges: Array.from(this.selectedEdges),
      count: this.selectedNodes.size + this.selectedEdges.size,
    };
  }

  /**
   * Check if there's any selection
   * @returns {boolean}
   */
  hasSelection() {
    return this.selectedNodes.size > 0 || this.selectedEdges.size > 0;
  }

  /**
   * Get count of selected items
   * @returns {Object}
   */
  getSelectionCount() {
    return {
      nodes: this.selectedNodes.size,
      edges: this.selectedEdges.size,
      total: this.selectedNodes.size + this.selectedEdges.size,
    };
  }

  /**
   * Set selection mode
   * @param {string} mode - 'replace', 'add', 'toggle', 'subtract'
   */
  setMode(mode) {
    if (["replace", "add", "toggle", "subtract"].includes(mode)) {
      this.mode = mode;
    }
  }

  /**
   * Get current selection mode
   * @returns {string}
   */
  getMode() {
    return this.mode;
  }

  /**
   * Helper to get set difference
   * @private
   */
  _getDifference(setA, setB) {
    return Array.from(setA).filter((x) => !setB.has(x));
  }

  /**
   * Serialize selection state
   * @returns {Object}
   */
  serialize() {
    return {
      nodes: Array.from(this.selectedNodes),
      edges: Array.from(this.selectedEdges),
      mode: this.mode,
      lastSelected: this.lastSelected,
    };
  }

  /**
   * Restore selection state
   * @param {Object} data - Serialized selection data
   */
  deserialize(data) {
    this.selectedNodes = new Set(data.nodes || []);
    this.selectedEdges = new Set(data.edges || []);
    this.mode = data.mode || "replace";
    this.lastSelected = data.lastSelected || null;

    this.stateManager.setState(
      "selection.nodes",
      Array.from(this.selectedNodes)
    );
    this.stateManager.setState(
      "selection.edges",
      Array.from(this.selectedEdges)
    );
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.clearSelection(false);
    this.eventBus.off("node:deleted");
    this.eventBus.off("edge:deleted");
    this.eventBus.off("canvas:cleared");
  }
}
