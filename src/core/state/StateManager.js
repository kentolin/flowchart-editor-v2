/**
 * StateManager.js - State Coordination & API Layer
 *
 * High-level state management layer that coordinates state changes
 * and provides a clean API for the rest of the application.
 * Sits between EditorState and other managers/components.
 *
 * DEPENDENCIES: EditorState
 *
 * @module core/state/StateManager
 * @version 1.0.0
 *
 * Purpose:
 * - Simplified state access for components
 * - Coordinates complex state changes across multiple domains
 * - Business logic for state operations
 * - Maintains state consistency
 * - Provides typed API instead of magic strings
 *
 * Responsibilities:
 * - Canvas operations (zoom, pan, fit-to-view)
 * - Node/edge queries (by ID, by type, connections)
 * - Selection operations (select, deselect, toggle, clear)
 * - Viewport mode management
 * - Theme operations
 * - State introspection and queries
 *
 * @example
 * const editorState = new EditorState(eventBus);
 * const stateManager = new StateManager(editorState);
 *
 * // High-level operations
 * stateManager.zoomTo(2.0);
 * stateManager.selectNode('node-1');
 * stateManager.setViewportMode('pan');
 * stateManager.fitToView();
 */

/**
 * StateManager Class
 *
 * Provides high-level state operations and queries.
 * Wraps EditorState with business logic and convenience methods.
 */
class StateManager {
  /**
   * Initialize the state manager
   *
   * @param {EditorState} editorState - Core editor state instance
   *
   * @throws {Error} If editorState is not valid
   *
   * @example
   * const manager = new StateManager(editorState);
   */
  constructor(editorState) {
    // Validate editorState
    if (!editorState || typeof editorState.get !== "function") {
      throw new Error(
        "StateManager: Constructor requires valid EditorState instance"
      );
    }

    // Store reference to state
    this.editorState = editorState;

    // Cache for computed values (cleared on state changes)
    this.queryCache = new Map();

    // Listen for state changes to invalidate cache
    if (editorState.eventBus && typeof editorState.eventBus.on === "function") {
      editorState.eventBus.on("state:changed", () => this.queryCache.clear());
      editorState.eventBus.on("state:batch-changed", () =>
        this.queryCache.clear()
      );
      editorState.eventBus.on("state:node-added", () =>
        this.queryCache.clear()
      );
      editorState.eventBus.on("state:node-removed", () =>
        this.queryCache.clear()
      );
      editorState.eventBus.on("state:node-updated", () =>
        this.queryCache.clear()
      );
      editorState.eventBus.on("state:edge-added", () =>
        this.queryCache.clear()
      );
      editorState.eventBus.on("state:edge-removed", () =>
        this.queryCache.clear()
      );
      editorState.eventBus.on("state:selection-changed", () =>
        this.queryCache.clear()
      );
    }
  }

  /**
   * Get the underlying EditorState
   *
   * Use this for direct state access when needed.
   *
   * @returns {EditorState} The editor state instance
   *
   * @example
   * const raw = stateManager.getEditorState();
   * raw.set('custom.field', value);
   */
  getEditorState() {
    return this.editorState;
  }

  // ==================== CANVAS OPERATIONS ====================

  /**
   * Set canvas zoom level
   *
   * @param {number} zoomLevel - Zoom factor (1.0 = 100%, 2.0 = 200%)
   * @param {Object} [options] - Optional metadata
   * @param {string} [options.reason] - Why zoom changed
   *
   * @throws {Error} If zoom is not a positive number
   *
   * @example
   * stateManager.setZoom(1.5); // 150% zoom
   * stateManager.setZoom(0.5); // 50% zoom
   */
  setZoom(zoomLevel, options = {}) {
    if (typeof zoomLevel !== "number" || zoomLevel <= 0) {
      throw new Error(
        `StateManager.setZoom: Zoom must be positive number, got ${zoomLevel}`
      );
    }

    this.editorState.set("canvas.zoom", zoomLevel, {
      reason: options.reason || "zoom changed",
    });
  }

  /**
   * Get current zoom level
   *
   * @returns {number} Current zoom factor
   *
   * @example
   * const zoom = stateManager.getZoom(); // 1.5
   */
  getZoom() {
    return this.editorState.get("canvas.zoom", 1);
  }

  /**
   * Zoom in (increase zoom by 20%)
   *
   * @param {Object} [options] - Optional metadata
   * @param {string} [options.reason] - Why zoom changed
   *
   * @example
   * stateManager.zoomIn();
   * stateManager.zoomIn({ reason: 'user pressed Ctrl+=' });
   */
  zoomIn(options = {}) {
    const current = this.getZoom();
    const next = Math.min(current * 1.2, 5); // Max 500% zoom
    this.setZoom(next, { reason: options.reason || "zoom in" });
  }

  /**
   * Zoom out (decrease zoom by 17%)
   *
   * @param {Object} [options] - Optional metadata
   * @param {string} [options.reason] - Why zoom changed
   *
   * @example
   * stateManager.zoomOut();
   * stateManager.zoomOut({ reason: 'user pressed Ctrl+-' });
   */
  zoomOut(options = {}) {
    const current = this.getZoom();
    const next = Math.max(current / 1.2, 0.1); // Min 10% zoom
    this.setZoom(next, { reason: options.reason || "zoom out" });
  }

  /**
   * Reset zoom to 100%
   *
   * @param {Object} [options] - Optional metadata
   *
   * @example
   * stateManager.resetZoom();
   */
  resetZoom(options = {}) {
    this.setZoom(1, { reason: options.reason || "reset zoom" });
  }

  /**
   * Set canvas pan (translation)
   *
   * @param {number} x - X offset
   * @param {number} y - Y offset
   * @param {Object} [options] - Optional metadata
   * @param {string} [options.reason] - Why pan changed
   *
   * @example
   * stateManager.setPan(100, 50);
   */
  setPan(x, y, options = {}) {
    if (typeof x !== "number" || typeof y !== "number") {
      throw new Error(
        `StateManager.setPan: Coordinates must be numbers, got (${typeof x}, ${typeof y})`
      );
    }

    this.editorState.update(
      {
        "canvas.panX": x,
        "canvas.panY": y,
      },
      {
        reason: options.reason || "pan changed",
      }
    );
  }

  /**
   * Get current pan position
   *
   * @returns {Object} Object with x and y pan values
   *
   * @example
   * const pan = stateManager.getPan();
   * console.log(pan); // { x: 100, y: 50 }
   */
  getPan() {
    return {
      x: this.editorState.get("canvas.panX", 0),
      y: this.editorState.get("canvas.panY", 0),
    };
  }

  /**
   * Pan by offset (relative pan)
   *
   * @param {number} deltaX - X offset to add
   * @param {number} deltaY - Y offset to add
   * @param {Object} [options] - Optional metadata
   *
   * @example
   * stateManager.panBy(50, 30); // Move view by 50 right, 30 down
   */
  panBy(deltaX, deltaY, options = {}) {
    if (typeof deltaX !== "number" || typeof deltaY !== "number") {
      throw new Error(
        `StateManager.panBy: Deltas must be numbers, got (${typeof deltaX}, ${typeof deltaY})`
      );
    }

    const current = this.getPan();
    this.setPan(current.x + deltaX, current.y + deltaY, options);
  }

  /**
   * Reset pan to origin (0, 0)
   *
   * @param {Object} [options] - Optional metadata
   *
   * @example
   * stateManager.resetPan();
   */
  resetPan(options = {}) {
    this.setPan(0, 0, { reason: options.reason || "reset pan" });
  }

  /**
   * Fit all content to view
   *
   * Calculates bounds of all nodes and sets zoom/pan to fit them
   * with padding.
   *
   * @param {Object} [options] - Optional metadata
   * @param {number} [options.padding=50] - Padding around content
   * @param {string} [options.reason] - Why fit was triggered
   *
   * @example
   * stateManager.fitToView();
   * stateManager.fitToView({ padding: 100 });
   */
  fitToView(options = {}) {
    const padding = options.padding ?? 50;
    const nodes = this.editorState.getAllNodes();

    if (nodes.length === 0) {
      this.resetZoom();
      this.resetPan();
      return;
    }

    // Calculate bounds
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const node of nodes) {
      const x1 = node.x || 0;
      const y1 = node.y || 0;
      const x2 = x1 + (node.width || 100);
      const y2 = y1 + (node.height || 100);

      minX = Math.min(minX, x1);
      minY = Math.min(minY, y1);
      maxX = Math.max(maxX, x2);
      maxY = Math.max(maxY, y2);
    }

    // Get canvas dimensions
    const canvasWidth = this.editorState.get("canvas.width", 800);
    const canvasHeight = this.editorState.get("canvas.height", 600);

    // Calculate zoom to fit
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;
    const zoomX = canvasWidth / contentWidth;
    const zoomY = canvasHeight / contentHeight;
    const zoom = Math.min(zoomX, zoomY, 1); // Never zoom in more than 100%

    // Calculate pan to center
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const panX = canvasWidth / 2 - centerX * zoom;
    const panY = canvasHeight / 2 - centerY * zoom;

    // Apply both zoom and pan
    this.editorState.update(
      {
        "canvas.zoom": zoom,
        "canvas.panX": panX,
        "canvas.panY": panY,
      },
      {
        reason: options.reason || "fit to view",
      }
    );
  }

  /**
   * Set canvas dimensions
   *
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {Object} [options] - Optional metadata
   *
   * @example
   * stateManager.setCanvasSize(1920, 1080);
   */
  setCanvasSize(width, height, options = {}) {
    if (typeof width !== "number" || typeof height !== "number") {
      throw new Error(
        `StateManager.setCanvasSize: Dimensions must be numbers, got (${typeof width}, ${typeof height})`
      );
    }

    this.editorState.update(
      {
        "canvas.width": width,
        "canvas.height": height,
      },
      {
        reason: options.reason || "canvas resized",
      }
    );
  }

  /**
   * Get canvas dimensions
   *
   * @returns {Object} Object with width and height
   *
   * @example
   * const size = stateManager.getCanvasSize();
   * console.log(size); // { width: 1920, height: 1080 }
   */
  getCanvasSize() {
    return {
      width: this.editorState.get("canvas.width", 800),
      height: this.editorState.get("canvas.height", 600),
    };
  }

  // ==================== SELECTION OPERATIONS ====================

  /**
   * Select a single node
   *
   * Replaces current selection with this node.
   *
   * @param {string} nodeId - Node to select
   * @param {Object} [options] - Optional metadata
   * @param {string} [options.reason] - Why node was selected
   *
   * @example
   * stateManager.selectNode('node-1');
   */
  selectNode(nodeId, options = {}) {
    if (!nodeId || typeof nodeId !== "string") {
      throw new Error(
        `StateManager.selectNode: nodeId must be non-empty string, got ${typeof nodeId}`
      );
    }

    this.editorState.setSelection(
      { nodeIds: [nodeId], edgeIds: [] },
      {
        reason: options.reason || "node selected",
      }
    );
  }

  /**
   * Select multiple nodes
   *
   * Replaces current selection with these nodes.
   *
   * @param {string[]} nodeIds - Node IDs to select
   * @param {Object} [options] - Optional metadata
   *
   * @example
   * stateManager.selectNodes(['node-1', 'node-2', 'node-3']);
   */
  selectNodes(nodeIds, options = {}) {
    if (!Array.isArray(nodeIds)) {
      throw new Error(
        `StateManager.selectNodes: nodeIds must be array, got ${typeof nodeIds}`
      );
    }

    this.editorState.setSelection(
      { nodeIds, edgeIds: [] },
      {
        reason: options.reason || "nodes selected",
      }
    );
  }

  /**
   * Add node to selection
   *
   * @param {string} nodeId - Node to add
   * @param {Object} [options] - Optional metadata
   *
   * @example
   * stateManager.addToSelection('node-4');
   */
  addNodeToSelection(nodeId, options = {}) {
    if (!nodeId || typeof nodeId !== "string") {
      throw new Error(
        `StateManager.addNodeToSelection: nodeId must be non-empty string`
      );
    }

    const current = this.getSelectedNodeIds();
    if (!current.includes(nodeId)) {
      current.push(nodeId);
      this.editorState.setSelection(
        {
          nodeIds: current,
          edgeIds: this.getSelectedEdgeIds(),
        },
        {
          reason: options.reason || "node added to selection",
        }
      );
    }
  }

  /**
   * Remove node from selection
   *
   * @param {string} nodeId - Node to remove
   * @param {Object} [options] - Optional metadata
   *
   * @example
   * stateManager.removeFromSelection('node-1');
   */
  removeNodeFromSelection(nodeId, options = {}) {
    const current = this.getSelectedNodeIds();
    const filtered = current.filter((id) => id !== nodeId);

    if (filtered.length !== current.length) {
      this.editorState.setSelection(
        {
          nodeIds: filtered,
          edgeIds: this.getSelectedEdgeIds(),
        },
        {
          reason: options.reason || "node removed from selection",
        }
      );
    }
  }

  /**
   * Toggle node selection (select if not selected, deselect if selected)
   *
   * @param {string} nodeId - Node to toggle
   * @param {Object} [options] - Optional metadata
   *
   * @example
   * stateManager.toggleNode('node-1');
   */
  toggleNodeSelection(nodeId, options = {}) {
    const current = this.getSelectedNodeIds();
    if (current.includes(nodeId)) {
      this.removeNodeFromSelection(nodeId, options);
    } else {
      this.addNodeToSelection(nodeId, options);
    }
  }

  /**
   * Select edge
   *
   * @param {string} edgeId - Edge to select
   * @param {Object} [options] - Optional metadata
   *
   * @example
   * stateManager.selectEdge('edge-1');
   */
  selectEdge(edgeId, options = {}) {
    if (!edgeId || typeof edgeId !== "string") {
      throw new Error(
        `StateManager.selectEdge: edgeId must be non-empty string`
      );
    }

    this.editorState.setSelection(
      { nodeIds: [], edgeIds: [edgeId] },
      {
        reason: options.reason || "edge selected",
      }
    );
  }

  /**
   * Get selected node IDs
   *
   * @returns {string[]} Array of selected node IDs
   *
   * @example
   * const selected = stateManager.getSelectedNodeIds();
   * console.log(selected); // ['node-1', 'node-2']
   */
  getSelectedNodeIds() {
    return Array.from(this.editorState.get("selection.nodeIds", new Set()));
  }

  /**
   * Get selected edge IDs
   *
   * @returns {string[]} Array of selected edge IDs
   *
   * @example
   * const selected = stateManager.getSelectedEdgeIds();
   */
  getSelectedEdgeIds() {
    return Array.from(this.editorState.get("selection.edgeIds", new Set()));
  }

  /**
   * Get all selected entities
   *
   * @returns {Object} Object with nodeIds and edgeIds arrays
   *
   * @example
   * const selection = stateManager.getSelection();
   * console.log(selection); // { nodeIds: [...], edgeIds: [...] }
   */
  getSelection() {
    return {
      nodeIds: this.getSelectedNodeIds(),
      edgeIds: this.getSelectedEdgeIds(),
    };
  }

  /**
   * Check if node is selected
   *
   * @param {string} nodeId - Node to check
   *
   * @returns {boolean} True if node is selected
   *
   * @example
   * if (stateManager.isNodeSelected('node-1')) {
   *   console.log('Node 1 is selected');
   * }
   */
  isNodeSelected(nodeId) {
    return this.getSelectedNodeIds().includes(nodeId);
  }

  /**
   * Clear all selections
   *
   * @param {Object} [options] - Optional metadata
   *
   * @example
   * stateManager.clearSelection();
   */
  clearSelection(options = {}) {
    this.editorState.clearSelection({
      reason: options.reason || "selection cleared",
    });
  }

  /**
   * Select all nodes
   *
   * @param {Object} [options] - Optional metadata
   *
   * @example
   * stateManager.selectAll();
   */
  selectAll(options = {}) {
    const allNodeIds = this.editorState.getAllNodes().map((node) => node.id);
    const allEdgeIds = this.editorState.getAllEdges().map((edge) => edge.id);

    this.editorState.setSelection(
      { nodeIds: allNodeIds, edgeIds: allEdgeIds },
      {
        reason: options.reason || "select all",
      }
    );
  }

  // ==================== VIEWPORT OPERATIONS ====================

  /**
   * Set viewport interaction mode
   *
   * @param {string} mode - Mode name (select, pan, zoom, etc.)
   * @param {Object} [options] - Optional metadata
   *
   * @example
   * stateManager.setViewportMode('pan');
   * stateManager.setViewportMode('select');
   */
  setViewportMode(mode, options = {}) {
    if (typeof mode !== "string") {
      throw new Error(
        `StateManager.setViewportMode: Mode must be string, got ${typeof mode}`
      );
    }

    this.editorState.set("viewport.mode", mode, {
      reason: options.reason || `viewport mode changed to ${mode}`,
    });
  }

  /**
   * Get current viewport mode
   *
   * @returns {string} Current mode
   *
   * @example
   * const mode = stateManager.getViewportMode();
   */
  getViewportMode() {
    return this.editorState.get("viewport.mode", "select");
  }

  /**
   * Set dragging state
   *
   * @param {boolean} isDragging - Is currently dragging?
   * @param {number} [startX] - Drag start X
   * @param {number} [startY] - Drag start Y
   * @param {Object} [options] - Optional metadata
   *
   * @example
   * stateManager.setDragging(true, 100, 50);
   * // ... perform drag ...
   * stateManager.setDragging(false);
   */
  setDragging(isDragging, startX = 0, startY = 0, options = {}) {
    this.editorState.update(
      {
        "viewport.isDragging": isDragging,
        "viewport.dragStartX": startX,
        "viewport.dragStartY": startY,
      },
      {
        reason: options.reason || (isDragging ? "drag started" : "drag ended"),
        silent: true, // Usually don't emit events for these frequent changes
      }
    );
  }

  /**
   * Get dragging state
   *
   * @returns {Object} Dragging state with isDragging, startX, startY
   *
   * @example
   * const drag = stateManager.getDragging();
   */
  getDragging() {
    return {
      isDragging: this.editorState.get("viewport.isDragging", false),
      startX: this.editorState.get("viewport.dragStartX", 0),
      startY: this.editorState.get("viewport.dragStartY", 0),
    };
  }

  // ==================== THEME OPERATIONS ====================

  /**
   * Set theme
   *
   * @param {string} themeName - Theme name (light, dark, etc.)
   * @param {Object} [options] - Optional metadata
   *
   * @example
   * stateManager.setTheme('dark');
   */
  setTheme(themeName, options = {}) {
    this.editorState.set("theme.name", themeName, {
      reason: options.reason || `theme changed to ${themeName}`,
    });
  }

  /**
   * Get current theme
   *
   * @returns {string} Current theme name
   *
   * @example
   * const theme = stateManager.getTheme();
   */
  getTheme() {
    return this.editorState.get("theme.name", "light");
  }

  /**
   * Set accent color
   *
   * @param {string} color - Color value (hex, rgb, etc.)
   * @param {Object} [options] - Optional metadata
   *
   * @example
   * stateManager.setAccentColor('#ff0000');
   */
  setAccentColor(color, options = {}) {
    this.editorState.set("theme.accentColor", color, {
      reason: options.reason || "accent color changed",
    });
  }

  /**
   * Get accent color
   *
   * @returns {string} Current accent color
   *
   * @example
   * const color = stateManager.getAccentColor();
   */
  getAccentColor() {
    return this.editorState.get("theme.accentColor", "#0066cc");
  }

  // ==================== UI OPERATIONS ====================

  /**
   * Set active UI panel
   *
   * @param {string} panelName - Panel to activate (properties, layers, etc.)
   * @param {Object} [options] - Optional metadata
   *
   * @example
   * stateManager.setActivePanel('properties');
   * stateManager.setActivePanel(null); // Close panel
   */
  setActivePanel(panelName, options = {}) {
    this.editorState.set("ui.activePanel", panelName, {
      reason: options.reason || "active panel changed",
    });
  }

  /**
   * Get active UI panel
   *
   * @returns {string} Active panel name or null
   *
   * @example
   * const panel = stateManager.getActivePanel();
   */
  getActivePanel() {
    return this.editorState.get("ui.activePanel", null);
  }

  /**
   * Toggle grid visibility
   *
   * @param {Object} [options] - Optional metadata
   *
   * @example
   * stateManager.toggleGrid();
   */
  toggleGrid(options = {}) {
    const current = this.editorState.get("ui.showGrid", true);
    this.editorState.set("ui.showGrid", !current, {
      reason: options.reason || "grid visibility toggled",
    });
  }

  /**
   * Toggle guides visibility
   *
   * @param {Object} [options] - Optional metadata
   *
   * @example
   * stateManager.toggleGuides();
   */
  toggleGuides(options = {}) {
    const current = this.editorState.get("ui.showGuides", true);
    this.editorState.set("ui.showGuides", !current, {
      reason: options.reason || "guides visibility toggled",
    });
  }

  /**
   * Toggle snap to grid
   *
   * @param {Object} [options] - Optional metadata
   *
   * @example
   * stateManager.toggleSnapToGrid();
   */
  toggleSnapToGrid(options = {}) {
    const current = this.editorState.get("ui.snapToGrid", true);
    this.editorState.set("ui.snapToGrid", !current, {
      reason: options.reason || "snap to grid toggled",
    });
  }

  // ==================== GRAPH QUERIES ====================

  /**
   * Get all nodes
   *
   * @returns {Array} Array of all node data
   *
   * @example
   * const nodes = stateManager.getAllNodes();
   */
  getAllNodes() {
    return this.editorState.getAllNodes();
  }

  /**
   * Get node by ID
   *
   * @param {string} nodeId - Node to retrieve
   *
   * @returns {Object} Node data or undefined
   *
   * @example
   * const node = stateManager.getNode('node-1');
   */
  getNode(nodeId) {
    return this.editorState.getNode(nodeId);
  }

  /**
   * Get all edges
   *
   * @returns {Array} Array of all edge data
   *
   * @example
   * const edges = stateManager.getAllEdges();
   */
  getAllEdges() {
    return this.editorState.getAllEdges();
  }

  /**
   * Get edge by ID
   *
   * @param {string} edgeId - Edge to retrieve
   *
   * @returns {Object} Edge data or undefined
   *
   * @example
   * const edge = stateManager.getEdge('edge-1');
   */
  getEdge(edgeId) {
    return this.editorState.getEdge(edgeId);
  }

  /**
   * Get edges connected to a node
   *
   * @param {string} nodeId - Node to query
   *
   * @returns {Object} Object with incoming and outgoing edges
   *
   * @example
   * const connections = stateManager.getNodeConnections('node-1');
   * console.log(connections);
   * // { incoming: [...], outgoing: [...] }
   */
  getNodeConnections(nodeId) {
    const cacheKey = `connections:${nodeId}`;
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey);
    }

    const incoming = [];
    const outgoing = [];

    for (const edge of this.getAllEdges()) {
      if (edge.targetId === nodeId) {
        incoming.push(edge);
      }
      if (edge.sourceId === nodeId) {
        outgoing.push(edge);
      }
    }

    const result = { incoming, outgoing };
    this.queryCache.set(cacheKey, result);
    return result;
  }

  /**
   * Get node count
   *
   * @returns {number} Number of nodes
   *
   * @example
   * const count = stateManager.getNodeCount();
   */
  getNodeCount() {
    return this.editorState.getAllNodes().length;
  }

  /**
   * Get edge count
   *
   * @returns {number} Number of edges
   *
   * @example
   * const count = stateManager.getEdgeCount();
   */
  getEdgeCount() {
    return this.editorState.getAllEdges().length;
  }

  /**
   * Get selection count
   *
   * @returns {Object} Count of selected nodes and edges
   *
   * @example
   * const counts = stateManager.getSelectionCount();
   * console.log(counts); // { nodes: 2, edges: 1 }
   */
  getSelectionCount() {
    return {
      nodes: this.getSelectedNodeIds().length,
      edges: this.getSelectedEdgeIds().length,
    };
  }

  // ==================== DEBUG & INTROSPECTION ====================

  /**
   * Get complete state summary
   *
   * @returns {Object} Summary of current state
   *
   * @example
   * const summary = stateManager.getSummary();
   */
  getSummary() {
    return {
      canvas: {
        zoom: this.getZoom(),
        pan: this.getPan(),
        size: this.getCanvasSize(),
      },
      graph: {
        nodeCount: this.getNodeCount(),
        edgeCount: this.getEdgeCount(),
      },
      selection: {
        selectedNodes: this.getSelectedNodeIds(),
        selectedEdges: this.getSelectedEdgeIds(),
      },
      viewport: {
        mode: this.getViewportMode(),
        isDragging: this.getDragging().isDragging,
      },
      theme: this.getTheme(),
      activePanel: this.getActivePanel(),
    };
  }

  /**
   * Print state summary to console
   *
   * @example
   * stateManager.printSummary();
   */
  printSummary() {
    const summary = this.getSummary();
    console.log("========== StateManager Summary ==========");
    console.log("Canvas:");
    console.log(`  Zoom: ${(summary.canvas.zoom * 100).toFixed(0)}%`);
    console.log(
      `  Pan: (${summary.canvas.pan.x.toFixed(
        0
      )}, ${summary.canvas.pan.y.toFixed(0)})`
    );
    console.log(
      `  Size: ${summary.canvas.size.width}x${summary.canvas.size.height}`
    );
    console.log("Graph:");
    console.log(`  Nodes: ${summary.graph.nodeCount}`);
    console.log(`  Edges: ${summary.graph.edgeCount}`);
    console.log("Selection:");
    console.log(
      `  Selected: ${summary.selection.selectedNodes.length} nodes, ${summary.selection.selectedEdges.length} edges`
    );
    console.log("Viewport:");
    console.log(`  Mode: ${summary.viewport.mode}`);
    console.log(`  Dragging: ${summary.viewport.isDragging}`);
    console.log(`Theme: ${summary.theme}`);
    console.log(`Active Panel: ${summary.activePanel || "none"}`);
    console.log("=".repeat(41));
  }
}

export { StateManager };
