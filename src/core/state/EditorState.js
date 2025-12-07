/**
 * EditorState.js - Low-Level State Storage
 *
 * Pure data storage layer with generic get/set/update operations.
 * NO business logic - just stores data and emits events.
 *
 * REMOVED: addNode(), removeNode(), addEdge(), etc. (moved to StateManager)
 * KEPT: get(), set(), update() - generic data access
 *
 * StateManager directly manipulates this data structure.
 *
 * @module core/state/EditorState
 * @version 3.0.0 - Simplified Storage Layer
 */

import { DebugLogger } from "../../utils/debug/DebugLogger.js";

export class EditorState {
  /**
   * Create EditorState
   *
   * @param {EventBus} eventBus - Event bus for state change notifications
   */
  constructor(eventBus) {
    this.log = new DebugLogger("EditorState", "#673AB7");
    this.log.enter("constructor");

    if (!eventBus) {
      this.log.error("constructor", "EventBus is required");
      throw new Error("EditorState: EventBus is required");
    }

    this.eventBus = eventBus;

    // Initialize state structure
    this.state = {
      // Graph data
      graph: {
        nodes: new Map(), // nodeId -> node data
        edges: new Map(), // edgeId -> edge data
      },

      // Selection
      selection: {
        nodeIds: new Set(),
        edgeIds: new Set(),
      },

      // Canvas
      canvas: {
        zoom: 1.0,
        panX: 0,
        panY: 0,
        width: 800,
        height: 600,
      },

      // Viewport
      viewport: {
        mode: "default", // 'default' | 'panning' | 'selecting' | 'connecting'
        isDragging: false,
        dragStartX: 0,
        dragStartY: 0,
      },

      // UI
      ui: {
        activePanel: null,
        showGrid: true,
        showGuides: true,
        snapToGrid: false,
      },

      // Theme
      theme: {
        name: "light",
        accentColor: "#1976d2",
      },

      // History
      history: {
        canUndo: false,
        canRedo: false,
        historyIndex: 0,
        historySize: 0,
      },

      // Validation
      validation: {
        hasErrors: false,
        errorCount: 0,
        errors: new Map(), // itemId -> error message
      },
    };

    // Change tracking
    this.changeHistory = [];
    this.maxChangeHistory = 50;

    this.log.info("constructor", "✓ EditorState initialized (Pure Storage)");
    this.log.exit("constructor");
  }

  // ==========================================================================
  // GENERIC DATA ACCESS - Core Operations
  // ==========================================================================

  /**
   * Get value at path
   *
   * @param {string} path - Dot-separated path (e.g., 'canvas.zoom')
   * @param {*} defaultValue - Default value if path doesn't exist
   * @returns {*} Value at path or default
   */
  get(path, defaultValue = undefined) {
    const keys = path.split(".");
    let current = this.state;

    for (const key of keys) {
      if (current === undefined || current === null) {
        return defaultValue;
      }
      current = current[key];
    }

    return current !== undefined ? current : defaultValue;
  }

  /**
   * Set value at path
   *
   * @param {string} path - Dot-separated path
   * @param {*} value - Value to set
   * @param {Object} options - Options {silent: boolean}
   */
  set(path, value, options = {}) {
    this.log.enter("set", { path, value });

    const keys = path.split(".");
    const lastKey = keys.pop();
    let current = this.state;

    // Navigate to parent
    for (const key of keys) {
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }

    // Set value
    const oldValue = current[lastKey];
    current[lastKey] = value;

    // Record change
    this._recordChange("set", path, { oldValue, newValue: value });

    // Emit event
    if (!options.silent) {
      this.eventBus.emit("state:changed", {
        type: "set",
        path,
        oldValue,
        newValue: value,
      });
    }

    this.log.info("set", `✓ Set '${path}' = ${JSON.stringify(value)}`);
    this.log.exit("set");
  }

  /**
   * Update multiple paths at once
   *
   * @param {Object} updates - Object with path -> value mappings
   * @param {Object} options - Options {silent: boolean}
   */
  update(updates, options = {}) {
    this.log.enter("update", { updates });

    const changes = [];

    for (const [path, value] of Object.entries(updates)) {
      const keys = path.split(".");
      const lastKey = keys.pop();
      let current = this.state;

      // Navigate to parent
      for (const key of keys) {
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key];
      }

      // Set value
      const oldValue = current[lastKey];
      current[lastKey] = value;

      changes.push({ path, oldValue, newValue: value });
    }

    // Record change
    this._recordChange("update", "multiple", { changes });

    // Emit event
    if (!options.silent) {
      this.eventBus.emit("state:batch-changed", {
        type: "update",
        changes,
      });
    }

    this.log.info("update", `✓ Updated ${changes.length} paths`);
    this.log.exit("update");
  }

  // ==========================================================================
  // DIRECT DATA STRUCTURE ACCESS - For StateManager
  // ==========================================================================

  /**
   * Get nodes Map
   * StateManager directly manipulates this
   *
   * @returns {Map<string, Object>}
   */
  getNodesMap() {
    return this.state.graph.nodes;
  }

  /**
   * Get edges Map
   * StateManager directly manipulates this
   *
   * @returns {Map<string, Object>}
   */
  getEdgesMap() {
    return this.state.graph.edges;
  }

  /**
   * Get selection Sets
   * StateManager directly manipulates this
   *
   * @returns {Object} {nodeIds: Set, edgeIds: Set}
   */
  getSelectionSets() {
    return this.state.selection;
  }

  /**
   * Emit state change event
   * Called by StateManager after direct manipulation
   *
   * @param {string} type - Change type ('node-added', 'edge-removed', etc.)
   * @param {Object} data - Change data
   */
  emitChange(type, data) {
    this.eventBus.emit(`state:${type}`, data);
    this.eventBus.emit("state:changed", { type, ...data });
  }

  // ==========================================================================
  // SNAPSHOT AND DEBUG
  // ==========================================================================

  /**
   * Get complete state snapshot
   *
   * @returns {Object} Deep copy of entire state
   */
  getSnapshot() {
    return {
      graph: {
        nodes: Array.from(this.state.graph.nodes.entries()).map(
          ([id, data]) => ({
            id,
            ...data,
          })
        ),
        edges: Array.from(this.state.graph.edges.entries()).map(
          ([id, data]) => ({
            id,
            ...data,
          })
        ),
      },
      selection: {
        nodeIds: Array.from(this.state.selection.nodeIds),
        edgeIds: Array.from(this.state.selection.edgeIds),
      },
      canvas: { ...this.state.canvas },
      viewport: { ...this.state.viewport },
      ui: { ...this.state.ui },
      theme: { ...this.state.theme },
      history: { ...this.state.history },
      validation: {
        ...this.state.validation,
        errors: Array.from(this.state.validation.errors.entries()),
      },
    };
  }

  /**
   * Get change history
   *
   * @returns {Array} Array of change records
   */
  getChangeHistory() {
    return [...this.changeHistory];
  }

  /**
   * Clear change history
   */
  clearChangeHistory() {
    this.changeHistory = [];
    this.log.info("clearChangeHistory", "✓ Change history cleared");
  }

  /**
   * Get debug info
   *
   * @returns {Object}
   */
  debugInfo() {
    return {
      nodes: this.state.graph.nodes.size,
      edges: this.state.graph.edges.size,
      selectedNodes: this.state.selection.nodeIds.size,
      selectedEdges: this.state.selection.edgeIds.size,
      zoom: this.state.canvas.zoom,
      pan: { x: this.state.canvas.panX, y: this.state.canvas.panY },
      viewportMode: this.state.viewport.mode,
      theme: this.state.theme.name,
      changeHistory: this.changeHistory.length,
    };
  }

  /**
   * Print debug info
   */
  printDebugInfo() {
    const info = this.debugInfo();
    console.log("========== EditorState Debug Info ==========");
    console.log(`Nodes: ${info.nodes}, Edges: ${info.edges}`);
    console.log(
      `Selection: ${info.selectedNodes} nodes, ${info.selectedEdges} edges`
    );
    console.log(
      `Canvas: Zoom ${(info.zoom * 100).toFixed(0)}%, Pan (${info.pan.x.toFixed(
        0
      )}, ${info.pan.y.toFixed(0)})`
    );
    console.log(`Viewport Mode: ${info.viewportMode}`);
    console.log(`Theme: ${info.theme}`);
    console.log(`Change History: ${info.changeHistory} entries`);
    console.log("=".repeat(44));
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Record a change in history
   *
   * @private
   */
  _recordChange(operation, target, data) {
    const change = {
      timestamp: Date.now(),
      operation,
      target,
      data,
    };

    this.changeHistory.push(change);

    // Limit history size
    if (this.changeHistory.length > this.maxChangeHistory) {
      this.changeHistory.shift();
    }
  }
}
