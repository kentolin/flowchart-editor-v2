/**
 * EditorState.js - Core Editor State Management
 *
 * Central state container for the editor. Maintains all application state
 * and notifies listeners when state changes occur.
 *
 * DEPENDENCIES: EventBus
 *
 * @module core/state/EditorState
 * @version 1.0.0
 *
 * Purpose:
 * - Single source of truth for all editor state
 * - Change notifications through events
 * - State queries and introspection
 * - Immutable-friendly state updates
 * - Clear separation of concerns
 *
 * State Structure:
 * - canvas: Canvas/viewport related state
 * - graph: Node and edge data
 * - ui: UI component state
 * - selection: Currently selected entities
 * - viewport: Zoom and pan settings
 * - theme: Visual theme settings
 *
 * @example
 * const eventBus = new EventBus();
 * const state = new EditorState(eventBus);
 *
 * // Listen for changes
 * eventBus.on('state:changed', (change) => {
 *   console.log('State changed:', change.path, change.value);
 * });
 *
 * // Update state
 * state.set('canvas.zoom', 1.5);
 * state.set('selection.nodeIds', ['node-1', 'node-2']);
 */

/**
 * EditorState Class
 *
 * Manages application state with change notification through EventBus.
 * Provides both getter/setter interface and bulk update methods.
 */
class EditorState {
  /**
   * Initialize editor state
   *
   * Sets up internal state object and validates EventBus dependency.
   *
   * @param {EventBus} eventBus - Event emitter for state change notifications
   *
   * @throws {Error} If eventBus is not provided
   *
   * @example
   * const state = new EditorState(eventBus);
   */
  constructor(eventBus) {
    // Validate eventBus
    if (!eventBus || typeof eventBus.emit !== "function") {
      throw new Error(
        "EditorState: Constructor requires valid EventBus instance with emit method"
      );
    }

    // Store reference to event bus
    this.eventBus = eventBus;

    // Initialize state tree
    // Using nested objects to organize related state
    this.state = {
      // Canvas/viewport state
      canvas: {
        width: 0,
        height: 0,
        zoom: 1,
        panX: 0,
        panY: 0,
      },

      // Graph data - nodes and edges
      graph: {
        nodes: new Map(), // nodeId -> nodeData
        edges: new Map(), // edgeId -> edgeData
        nextNodeId: 1,
        nextEdgeId: 1,
      },

      // UI component state
      ui: {
        activePanel: null, // Which panel is open (properties, layers, etc.)
        showGrid: true,
        showGuides: true,
        snapToGrid: true,
      },

      // Current selections
      selection: {
        nodeIds: new Set(), // Currently selected node IDs
        edgeIds: new Set(), // Currently selected edge IDs
      },

      // Viewport settings
      viewport: {
        mode: "select", // select, pan, zoom, etc.
        isDragging: false,
        dragStartX: 0,
        dragStartY: 0,
      },

      // Visual theme
      theme: {
        name: "light", // light or dark
        accentColor: "#0066cc",
      },

      // Undo/redo history
      history: {
        canUndo: false,
        canRedo: false,
        historyIndex: -1,
        historySize: 0,
      },

      // Validation state
      validation: {
        hasErrors: false,
        errorCount: 0,
        errors: new Map(), // entityId -> [errors]
      },
    };

    // Track state changes for debugging
    this.changeHistory = [];
    this.maxChangeHistory = 50;
  }

  /**
   * Get a state value
   *
   * Retrieves a value from state using dot-notation path.
   * Returns undefined if path doesn't exist.
   *
   * @param {string} path - Dot-notation path to state value
   * @param {*} defaultValue - Value to return if path not found
   *
   * @returns {*} State value at path
   *
   * @example
   * const zoom = state.get('canvas.zoom'); // 1
   * const nodes = state.get('graph.nodes'); // Map object
   * const missing = state.get('does.not.exist', {}); // {}
   */
  get(path, defaultValue = undefined) {
    if (typeof path !== "string") {
      throw new Error(
        `EditorState.get: Path must be string, got ${typeof path}`
      );
    }

    // Split path and traverse
    const parts = path.split(".");
    let current = this.state;

    for (const part of parts) {
      if (current === null || typeof current !== "object") {
        return defaultValue;
      }
      current = current[part];
      if (current === undefined) {
        return defaultValue;
      }
    }

    return current;
  }

  /**
   * Set a state value
   *
   * Updates a value in state using dot-notation path.
   * Emits 'state:changed' event with change details.
   *
   * @param {string} path - Dot-notation path to state value
   * @param {*} value - New value to set
   * @param {Object} [options] - Optional metadata
   * @param {string} [options.reason] - Why this change occurred
   * @param {boolean} [options.silent=false] - Don't emit event?
   *
   * @returns {*} Old value that was replaced
   *
   * @throws {Error} If path is invalid
   *
   * @example
   * state.set('canvas.zoom', 1.5);
   * state.set('ui.activePanel', 'properties', { reason: 'user clicked panel' });
   *
   * // Listen for the change
   * eventBus.on('state:changed', (change) => {
   *   console.log('Changed:', change.path); // 'canvas.zoom'
   *   console.log('New:', change.newValue); // 1.5
   *   console.log('Old:', change.oldValue); // 1
   * });
   */
  set(path, value, options = {}) {
    if (typeof path !== "string") {
      throw new Error(
        `EditorState.set: Path must be string, got ${typeof path}`
      );
    }

    // Split path into parts
    const parts = path.split(".");
    if (parts.length === 0) {
      throw new Error("EditorState.set: Path cannot be empty");
    }

    // Navigate to parent object
    let current = this.state;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        // Auto-create intermediate objects
        current[part] = {};
      }
      current = current[part];
      if (current === null || typeof current !== "object") {
        throw new Error(
          `EditorState.set: Cannot navigate to '${parts
            .slice(0, i + 1)
            .join(".")}' - not an object`
        );
      }
    }

    // Get old value and set new value
    const lastKey = parts[parts.length - 1];
    const oldValue = current[lastKey];

    // Only update if value actually changed
    if (oldValue !== value) {
      current[lastKey] = value;

      // Record change history
      this._recordChange({
        path,
        oldValue,
        newValue: value,
        reason: options.reason,
        timestamp: new Date(),
      });

      // Emit event unless silent
      if (!options.silent) {
        this.eventBus.emit("state:changed", {
          path,
          oldValue,
          newValue: value,
          reason: options.reason,
          timestamp: new Date(),
        });
      }
    }

    return oldValue;
  }

  /**
   * Update multiple state values at once
   *
   * Batch update multiple state paths. Emits single 'state:batch-changed' event
   * instead of individual events for each change.
   *
   * @param {Object} updates - Object with path -> value pairs
   * @param {Object} [options] - Optional metadata
   * @param {string} [options.reason] - Why these changes occurred
   * @param {boolean} [options.silent=false] - Don't emit event?
   *
   * @returns {Object} Object with path -> oldValue pairs
   *
   * @example
   * state.update({
   *   'canvas.zoom': 2,
   *   'canvas.panX': 100,
   *   'canvas.panY': 50,
   *   'ui.activePanel': 'layers'
   * }, { reason: 'user zoomed in' });
   *
   * // Single batch event instead of 4 individual events
   * eventBus.on('state:batch-changed', (changes) => {
   *   console.log('Multiple changes:', changes.length); // 4
   * });
   */
  update(updates, options = {}) {
    if (
      typeof updates !== "object" ||
      updates === null ||
      Array.isArray(updates)
    ) {
      throw new Error(
        `EditorState.update: Updates must be object, got ${typeof updates}`
      );
    }

    const changes = [];
    const oldValues = {};

    // Apply each update
    for (const [path, value] of Object.entries(updates)) {
      const oldValue = this.set(path, value, { silent: true });
      oldValues[path] = oldValue;
      changes.push({
        path,
        oldValue,
        newValue: value,
      });
    }

    // Record batch change
    this._recordChange({
      type: "batch",
      changes,
      reason: options.reason,
      timestamp: new Date(),
    });

    // Emit batch event unless silent
    if (!options.silent) {
      this.eventBus.emit("state:batch-changed", {
        changes,
        reason: options.reason,
        timestamp: new Date(),
      });
    }

    return oldValues;
  }

  /**
   * Add a node to graph state
   *
   * @param {string} nodeId - Unique node identifier
   * @param {Object} nodeData - Node data (x, y, width, height, type, etc.)
   * @param {Object} [options] - Optional metadata
   * @param {string} [options.reason] - Why node was added
   *
   * @example
   * state.addNode('node-1', {
   *   x: 100,
   *   y: 100,
   *   width: 120,
   *   height: 80,
   *   type: 'rectangle',
   *   label: 'Component A'
   * });
   */
  addNode(nodeId, nodeData, options = {}) {
    if (!nodeId || typeof nodeId !== "string") {
      throw new Error(
        `EditorState.addNode: nodeId must be non-empty string, got ${typeof nodeId}`
      );
    }

    if (!nodeData || typeof nodeData !== "object") {
      throw new Error(
        `EditorState.addNode: nodeData must be object, got ${typeof nodeData}`
      );
    }

    const nodes = this.state.graph.nodes;

    if (nodes.has(nodeId)) {
      throw new Error(`EditorState.addNode: Node '${nodeId}' already exists`);
    }

    // Store node data
    nodes.set(nodeId, { ...nodeData, id: nodeId });

    // Record and emit change
    this._recordChange({
      type: "node:added",
      nodeId,
      nodeData,
      reason: options.reason,
      timestamp: new Date(),
    });

    this.eventBus.emit("state:node-added", {
      nodeId,
      nodeData: nodes.get(nodeId),
      reason: options.reason,
      timestamp: new Date(),
    });
  }

  /**
   * Remove a node from graph state
   *
   * @param {string} nodeId - Node to remove
   * @param {Object} [options] - Optional metadata
   * @param {string} [options.reason] - Why node was removed
   *
   * @returns {Object} The node data that was removed
   *
   * @example
   * const removedNode = state.removeNode('node-1');
   */
  removeNode(nodeId, options = {}) {
    const nodes = this.state.graph.nodes;

    if (!nodes.has(nodeId)) {
      throw new Error(
        `EditorState.removeNode: Node '${nodeId}' does not exist`
      );
    }

    const nodeData = nodes.get(nodeId);
    nodes.delete(nodeId);

    // Record and emit change
    this._recordChange({
      type: "node:removed",
      nodeId,
      nodeData,
      reason: options.reason,
      timestamp: new Date(),
    });

    this.eventBus.emit("state:node-removed", {
      nodeId,
      nodeData,
      reason: options.reason,
      timestamp: new Date(),
    });

    return nodeData;
  }

  /**
   * Update node data
   *
   * @param {string} nodeId - Node to update
   * @param {Object} updates - Properties to update
   * @param {Object} [options] - Optional metadata
   * @param {string} [options.reason] - Why node was updated
   *
   * @example
   * state.updateNode('node-1', {
   *   x: 200,
   *   y: 150,
   *   label: 'Updated Label'
   * });
   */
  updateNode(nodeId, updates, options = {}) {
    const nodes = this.state.graph.nodes;

    if (!nodes.has(nodeId)) {
      throw new Error(
        `EditorState.updateNode: Node '${nodeId}' does not exist`
      );
    }

    const nodeData = nodes.get(nodeId);
    const oldData = { ...nodeData };

    // Update fields
    Object.assign(nodeData, updates);

    // Record and emit change
    this._recordChange({
      type: "node:updated",
      nodeId,
      updates,
      reason: options.reason,
      timestamp: new Date(),
    });

    this.eventBus.emit("state:node-updated", {
      nodeId,
      updates,
      oldData,
      newData: nodeData,
      reason: options.reason,
      timestamp: new Date(),
    });
  }

  /**
   * Get a node from graph state
   *
   * @param {string} nodeId - Node to retrieve
   *
   * @returns {Object} Node data or undefined
   *
   * @example
   * const node = state.getNode('node-1');
   */
  getNode(nodeId) {
    return this.state.graph.nodes.get(nodeId);
  }

  /**
   * Get all nodes
   *
   * @returns {Array} Array of all node data
   *
   * @example
   * const allNodes = state.getAllNodes();
   */
  getAllNodes() {
    return Array.from(this.state.graph.nodes.values());
  }

  /**
   * Add an edge to graph state
   *
   * @param {string} edgeId - Unique edge identifier
   * @param {Object} edgeData - Edge data (sourceId, targetId, type, etc.)
   * @param {Object} [options] - Optional metadata
   * @param {string} [options.reason] - Why edge was added
   *
   * @example
   * state.addEdge('edge-1', {
   *   sourceId: 'node-1',
   *   targetId: 'node-2',
   *   type: 'connection'
   * });
   */
  addEdge(edgeId, edgeData, options = {}) {
    if (!edgeId || typeof edgeId !== "string") {
      throw new Error(
        `EditorState.addEdge: edgeId must be non-empty string, got ${typeof edgeId}`
      );
    }

    if (!edgeData || typeof edgeData !== "object") {
      throw new Error(
        `EditorState.addEdge: edgeData must be object, got ${typeof edgeData}`
      );
    }

    const edges = this.state.graph.edges;

    if (edges.has(edgeId)) {
      throw new Error(`EditorState.addEdge: Edge '${edgeId}' already exists`);
    }

    // Store edge data
    edges.set(edgeId, { ...edgeData, id: edgeId });

    // Record and emit change
    this._recordChange({
      type: "edge:added",
      edgeId,
      edgeData,
      reason: options.reason,
      timestamp: new Date(),
    });

    this.eventBus.emit("state:edge-added", {
      edgeId,
      edgeData: edges.get(edgeId),
      reason: options.reason,
      timestamp: new Date(),
    });
  }

  /**
   * Remove an edge from graph state
   *
   * @param {string} edgeId - Edge to remove
   * @param {Object} [options] - Optional metadata
   * @param {string} [options.reason] - Why edge was removed
   *
   * @returns {Object} The edge data that was removed
   *
   * @example
   * const removedEdge = state.removeEdge('edge-1');
   */
  removeEdge(edgeId, options = {}) {
    const edges = this.state.graph.edges;

    if (!edges.has(edgeId)) {
      throw new Error(
        `EditorState.removeEdge: Edge '${edgeId}' does not exist`
      );
    }

    const edgeData = edges.get(edgeId);
    edges.delete(edgeId);

    // Record and emit change
    this._recordChange({
      type: "edge:removed",
      edgeId,
      edgeData,
      reason: options.reason,
      timestamp: new Date(),
    });

    this.eventBus.emit("state:edge-removed", {
      edgeId,
      edgeData,
      reason: options.reason,
      timestamp: new Date(),
    });

    return edgeData;
  }

  /**
   * Get an edge from graph state
   *
   * @param {string} edgeId - Edge to retrieve
   *
   * @returns {Object} Edge data or undefined
   *
   * @example
   * const edge = state.getEdge('edge-1');
   */
  getEdge(edgeId) {
    return this.state.graph.edges.get(edgeId);
  }

  /**
   * Get all edges
   *
   * @returns {Array} Array of all edge data
   *
   * @example
   * const allEdges = state.getAllEdges();
   */
  getAllEdges() {
    return Array.from(this.state.graph.edges.values());
  }

  /**
   * Update selection
   *
   * Replaces current selection with new selection.
   * Emits 'state:selection-changed' event.
   *
   * @param {Object} selection - Selection with nodeIds and/or edgeIds
   * @param {string[]} [selection.nodeIds=[]] - Selected node IDs
   * @param {string[]} [selection.edgeIds=[]] - Selected edge IDs
   * @param {Object} [options] - Optional metadata
   * @param {string} [options.reason] - Why selection changed
   *
   * @example
   * state.setSelection({
   *   nodeIds: ['node-1', 'node-2'],
   *   edgeIds: ['edge-1']
   * });
   */
  setSelection(selection, options = {}) {
    const oldSelection = {
      nodeIds: Array.from(this.state.selection.nodeIds),
      edgeIds: Array.from(this.state.selection.edgeIds),
    };

    // Update selection
    this.state.selection.nodeIds = new Set(selection.nodeIds || []);
    this.state.selection.edgeIds = new Set(selection.edgeIds || []);

    // Record and emit change
    this._recordChange({
      type: "selection:changed",
      oldSelection,
      newSelection: selection,
      reason: options.reason,
      timestamp: new Date(),
    });

    this.eventBus.emit("state:selection-changed", {
      oldSelection,
      newSelection: {
        nodeIds: Array.from(this.state.selection.nodeIds),
        edgeIds: Array.from(this.state.selection.edgeIds),
      },
      reason: options.reason,
      timestamp: new Date(),
    });
  }

  /**
   * Clear selection
   *
   * @param {Object} [options] - Optional metadata
   * @param {string} [options.reason] - Why selection was cleared
   *
   * @example
   * state.clearSelection();
   */
  clearSelection(options = {}) {
    this.setSelection({ nodeIds: [], edgeIds: [] }, options);
  }

  /**
   * Record state change in history
   *
   * @private
   *
   * @param {Object} change - Change record
   */
  _recordChange(change) {
    this.changeHistory.push(change);

    // Keep history size limited
    if (this.changeHistory.length > this.maxChangeHistory) {
      this.changeHistory.shift();
    }
  }

  /**
   * Get change history
   *
   * Returns recent state changes for debugging.
   *
   * @returns {Array} Array of recent changes
   *
   * @example
   * const history = state.getChangeHistory();
   * history.forEach(change => console.log(change));
   */
  getChangeHistory() {
    return [...this.changeHistory];
  }

  /**
   * Clear change history
   *
   * @example
   * state.clearChangeHistory();
   */
  clearChangeHistory() {
    this.changeHistory = [];
  }

  /**
   * Get full state snapshot
   *
   * Returns a copy of the current state.
   * Maps are converted to arrays for serialization.
   *
   * @returns {Object} State snapshot
   *
   * @example
   * const snapshot = state.getSnapshot();
   */
  getSnapshot() {
    return {
      canvas: { ...this.state.canvas },
      graph: {
        nodes: Array.from(this.state.graph.nodes.values()),
        edges: Array.from(this.state.graph.edges.values()),
        nextNodeId: this.state.graph.nextNodeId,
        nextEdgeId: this.state.graph.nextEdgeId,
      },
      ui: { ...this.state.ui },
      selection: {
        nodeIds: Array.from(this.state.selection.nodeIds),
        edgeIds: Array.from(this.state.selection.edgeIds),
      },
      viewport: { ...this.state.viewport },
      theme: { ...this.state.theme },
      history: { ...this.state.history },
      validation: {
        hasErrors: this.state.validation.hasErrors,
        errorCount: this.state.validation.errorCount,
        errors: Array.from(this.state.validation.errors.entries()),
      },
    };
  }

  /**
   * Get debug information
   *
   * @returns {Object} Debug info
   *
   * @example
   * const info = state.debugInfo();
   * console.log(info);
   */
  debugInfo() {
    return {
      nodeCount: this.state.graph.nodes.size,
      edgeCount: this.state.graph.edges.size,
      selectedNodes: this.state.selection.nodeIds.size,
      selectedEdges: this.state.selection.edgeIds.size,
      zoom: this.state.canvas.zoom,
      panX: this.state.canvas.panX,
      panY: this.state.canvas.panY,
      activePanel: this.state.ui.activePanel,
      changeHistorySize: this.changeHistory.length,
    };
  }

  /**
   * Print debug info
   *
   * @example
   * state.printDebugInfo();
   */
  printDebugInfo() {
    const info = this.debugInfo();
    console.log("========== EditorState Debug Info ==========");
    console.log(`Nodes: ${info.nodeCount}`);
    console.log(`Edges: ${info.edgeCount}`);
    console.log(
      `Selected: ${info.selectedNodes} nodes, ${info.selectedEdges} edges`
    );
    console.log(`Zoom: ${info.zoom.toFixed(2)}x`);
    console.log(`Pan: (${info.panX.toFixed(0)}, ${info.panY.toFixed(0)})`);
    console.log(`Active Panel: ${info.activePanel || "none"}`);
    console.log(`Change History: ${info.changeHistorySize}`);
    console.log("=".repeat(41));
  }
}

export { EditorState };
