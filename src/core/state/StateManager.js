/**
 * StateManager.js - State Coordination & API Layer
 *
 * High-level state management layer that coordinates state changes
 * and provides a clean API for the rest of the application.
 *
 * @module core/state/StateManager
 * @version 1.0.0
 */

import { DebugLogger } from "../../utils/debug/DebugLogger.js";

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
   */
  constructor(editorState) {
    // Initialize debug logger
    this.log = new DebugLogger("StateManager", "#FF5722");
    this.log.enter("constructor");

    // Validate editorState
    if (!editorState || typeof editorState.get !== "function") {
      this.log.error("constructor", "Invalid EditorState instance");
      throw new Error(
        "StateManager: Constructor requires valid EditorState instance"
      );
    }

    this.log.info("constructor", "EditorState validated");

    // Store reference to state
    this.editorState = editorState;

    // Cache for computed values (cleared on state changes)
    this.queryCache = new Map();

    // Listen for state changes to invalidate cache
    if (editorState.eventBus && typeof editorState.eventBus.on === "function") {
      this.log.info("constructor", "Setting up cache invalidation listeners");

      editorState.eventBus.on("state:changed", () => {
        this.log.info("constructor", "Cache cleared: state:changed");
        this.queryCache.clear();
      });
      editorState.eventBus.on("state:batch-changed", () => {
        this.log.info("constructor", "Cache cleared: state:batch-changed");
        this.queryCache.clear();
      });
      editorState.eventBus.on("state:node-added", () => {
        this.log.info("constructor", "Cache cleared: state:node-added");
        this.queryCache.clear();
      });
      editorState.eventBus.on("state:node-removed", () => {
        this.log.info("constructor", "Cache cleared: state:node-removed");
        this.queryCache.clear();
      });
      editorState.eventBus.on("state:node-updated", () => {
        this.log.info("constructor", "Cache cleared: state:node-updated");
        this.queryCache.clear();
      });
      editorState.eventBus.on("state:edge-added", () => {
        this.log.info("constructor", "Cache cleared: state:edge-added");
        this.queryCache.clear();
      });
      editorState.eventBus.on("state:edge-removed", () => {
        this.log.info("constructor", "Cache cleared: state:edge-removed");
        this.queryCache.clear();
      });
      editorState.eventBus.on("state:selection-changed", () => {
        this.log.info("constructor", "Cache cleared: state:selection-changed");
        this.queryCache.clear();
      });
    }

    this.log.info("constructor", "✓ StateManager initialized");
    this.log.exit("constructor");
  }

  /**
   * Get the underlying EditorState
   *
   * @returns {EditorState} The editor state instance
   */
  getEditorState() {
    this.log.enter("getEditorState");
    this.log.exit("getEditorState");
    return this.editorState;
  }

  // ==================== CANVAS OPERATIONS ====================

  /**
   * Set canvas zoom level
   *
   * @param {number} zoomLevel - Zoom factor (1.0 = 100%, 2.0 = 200%)
   * @param {Object} [options] - Optional metadata
   */
  setZoom(zoomLevel, options = {}) {
    this.log.enter("setZoom", { zoomLevel });

    if (typeof zoomLevel !== "number" || zoomLevel <= 0) {
      this.log.error("setZoom", `Invalid zoom: ${zoomLevel}`);
      throw new Error(
        `StateManager.setZoom: Zoom must be positive number, got ${zoomLevel}`
      );
    }

    this.editorState.set("canvas.zoom", zoomLevel, {
      reason: options.reason || "zoom changed",
    });

    this.log.info("setZoom", `✓ Zoom set to ${(zoomLevel * 100).toFixed(0)}%`);
    this.log.exit("setZoom");
  }

  /**
   * Get current zoom level
   *
   * @returns {number} Current zoom factor
   */
  getZoom() {
    this.log.enter("getZoom");

    const zoom = this.editorState.get("canvas.zoom", 1);

    this.log.info("getZoom", `Current zoom: ${(zoom * 100).toFixed(0)}%`);
    this.log.exit("getZoom");

    return zoom;
  }

  /**
   * Zoom in (increase zoom by 20%)
   *
   * @param {Object} [options] - Optional metadata
   */
  zoomIn(options = {}) {
    this.log.enter("zoomIn");

    const current = this.getZoom();
    const next = Math.min(current * 1.2, 5); // Max 500% zoom

    this.log.info(
      "zoomIn",
      `Zooming from ${(current * 100).toFixed(0)}% to ${(next * 100).toFixed(
        0
      )}%`
    );
    this.setZoom(next, { reason: options.reason || "zoom in" });

    this.log.exit("zoomIn");
  }

  /**
   * Zoom out (decrease zoom by 17%)
   *
   * @param {Object} [options] - Optional metadata
   */
  zoomOut(options = {}) {
    this.log.enter("zoomOut");

    const current = this.getZoom();
    const next = Math.max(current / 1.2, 0.1); // Min 10% zoom

    this.log.info(
      "zoomOut",
      `Zooming from ${(current * 100).toFixed(0)}% to ${(next * 100).toFixed(
        0
      )}%`
    );
    this.setZoom(next, { reason: options.reason || "zoom out" });

    this.log.exit("zoomOut");
  }

  /**
   * Reset zoom to 100%
   *
   * @param {Object} [options] - Optional metadata
   */
  resetZoom(options = {}) {
    this.log.enter("resetZoom");

    this.setZoom(1, { reason: options.reason || "reset zoom" });

    this.log.info("resetZoom", "✓ Zoom reset to 100%");
    this.log.exit("resetZoom");
  }

  /**
   * Set canvas pan (translation)
   *
   * @param {number} x - X offset
   * @param {number} y - Y offset
   * @param {Object} [options] - Optional metadata
   */
  setPan(x, y, options = {}) {
    this.log.enter("setPan", { x, y });

    if (typeof x !== "number" || typeof y !== "number") {
      this.log.error(
        "setPan",
        `Invalid coordinates: (${typeof x}, ${typeof y})`
      );
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

    this.log.info("setPan", `✓ Pan set to (${x.toFixed(0)}, ${y.toFixed(0)})`);
    this.log.exit("setPan");
  }

  /**
   * Get current pan position
   *
   * @returns {Object} Object with x and y pan values
   */
  getPan() {
    this.log.enter("getPan");

    const pan = {
      x: this.editorState.get("canvas.panX", 0),
      y: this.editorState.get("canvas.panY", 0),
    };

    this.log.info(
      "getPan",
      `Current pan: (${pan.x.toFixed(0)}, ${pan.y.toFixed(0)})`
    );
    this.log.exit("getPan");

    return pan;
  }

  /**
   * Pan by offset (relative pan)
   *
   * @param {number} deltaX - X offset to add
   * @param {number} deltaY - Y offset to add
   * @param {Object} [options] - Optional metadata
   */
  panBy(deltaX, deltaY, options = {}) {
    this.log.enter("panBy", { deltaX, deltaY });

    if (typeof deltaX !== "number" || typeof deltaY !== "number") {
      this.log.error(
        "panBy",
        `Invalid deltas: (${typeof deltaX}, ${typeof deltaY})`
      );
      throw new Error(
        `StateManager.panBy: Deltas must be numbers, got (${typeof deltaX}, ${typeof deltaY})`
      );
    }

    const current = this.getPan();
    this.setPan(current.x + deltaX, current.y + deltaY, options);

    this.log.info("panBy", `✓ Panned by (${deltaX}, ${deltaY})`);
    this.log.exit("panBy");
  }

  /**
   * Reset pan to origin (0, 0)
   *
   * @param {Object} [options] - Optional metadata
   */
  resetPan(options = {}) {
    this.log.enter("resetPan");

    this.setPan(0, 0, { reason: options.reason || "reset pan" });

    this.log.info("resetPan", "✓ Pan reset to origin");
    this.log.exit("resetPan");
  }

  /**
   * Fit all content to view
   *
   * @param {Object} [options] - Optional metadata
   */
  fitToView(options = {}) {
    this.log.enter("fitToView");

    const padding = options.padding ?? 50;
    const nodes = this.editorState.getAllNodes();

    if (nodes.length === 0) {
      this.log.warn("fitToView", "No nodes to fit");
      this.resetZoom();
      this.resetPan();
      this.log.exit("fitToView");
      return;
    }

    this.log.info(
      "fitToView",
      `Fitting ${nodes.length} nodes with ${padding}px padding`
    );

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

    this.log.info(
      "fitToView",
      `✓ Fitted to ${(zoom * 100).toFixed(0)}% zoom at (${panX.toFixed(
        0
      )}, ${panY.toFixed(0)})`
    );
    this.log.exit("fitToView");
  }

  /**
   * Set canvas dimensions
   *
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {Object} [options] - Optional metadata
   */
  setCanvasSize(width, height, options = {}) {
    this.log.enter("setCanvasSize", { width, height });

    if (typeof width !== "number" || typeof height !== "number") {
      this.log.error(
        "setCanvasSize",
        `Invalid dimensions: (${typeof width}, ${typeof height})`
      );
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

    this.log.info("setCanvasSize", `✓ Canvas size set to ${width}x${height}`);
    this.log.exit("setCanvasSize");
  }

  /**
   * Get canvas dimensions
   *
   * @returns {Object} Object with width and height
   */
  getCanvasSize() {
    this.log.enter("getCanvasSize");

    const size = {
      width: this.editorState.get("canvas.width", 800),
      height: this.editorState.get("canvas.height", 600),
    };

    this.log.info("getCanvasSize", `Canvas size: ${size.width}x${size.height}`);
    this.log.exit("getCanvasSize");

    return size;
  }

  // ==================== SELECTION OPERATIONS ====================

  /**
   * Select a single node
   *
   * @param {string} nodeId - Node to select
   * @param {Object} [options] - Optional metadata
   */
  selectNode(nodeId, options = {}) {
    this.log.enter("selectNode", { nodeId });

    if (!nodeId || typeof nodeId !== "string") {
      this.log.error("selectNode", `Invalid nodeId: ${typeof nodeId}`);
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

    this.log.info("selectNode", `✓ Selected node '${nodeId}'`);
    this.log.exit("selectNode");
  }

  /**
   * Select multiple nodes
   *
   * @param {string[]} nodeIds - Node IDs to select
   * @param {Object} [options] - Optional metadata
   */
  selectNodes(nodeIds, options = {}) {
    this.log.enter("selectNodes", { count: nodeIds.length });

    if (!Array.isArray(nodeIds)) {
      this.log.error("selectNodes", `Invalid nodeIds: ${typeof nodeIds}`);
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

    this.log.info("selectNodes", `✓ Selected ${nodeIds.length} nodes`);
    this.log.exit("selectNodes");
  }

  /**
   * Add node to selection
   *
   * @param {string} nodeId - Node to add
   * @param {Object} [options] - Optional metadata
   */
  addNodeToSelection(nodeId, options = {}) {
    this.log.enter("addNodeToSelection", { nodeId });

    if (!nodeId || typeof nodeId !== "string") {
      this.log.error("addNodeToSelection", `Invalid nodeId: ${typeof nodeId}`);
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
      this.log.info(
        "addNodeToSelection",
        `✓ Added node '${nodeId}' to selection (total: ${current.length})`
      );
    } else {
      this.log.info(
        "addNodeToSelection",
        `Node '${nodeId}' already in selection`
      );
    }

    this.log.exit("addNodeToSelection");
  }

  /**
   * Remove node from selection
   *
   * @param {string} nodeId - Node to remove
   * @param {Object} [options] - Optional metadata
   */
  removeNodeFromSelection(nodeId, options = {}) {
    this.log.enter("removeNodeFromSelection", { nodeId });

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
      this.log.info(
        "removeNodeFromSelection",
        `✓ Removed node '${nodeId}' from selection (remaining: ${filtered.length})`
      );
    } else {
      this.log.info(
        "removeNodeFromSelection",
        `Node '${nodeId}' not in selection`
      );
    }

    this.log.exit("removeNodeFromSelection");
  }

  /**
   * Toggle node selection
   *
   * @param {string} nodeId - Node to toggle
   * @param {Object} [options] - Optional metadata
   */
  toggleNodeSelection(nodeId, options = {}) {
    this.log.enter("toggleNodeSelection", { nodeId });

    const current = this.getSelectedNodeIds();
    if (current.includes(nodeId)) {
      this.log.info("toggleNodeSelection", "Node selected, will deselect");
      this.removeNodeFromSelection(nodeId, options);
    } else {
      this.log.info("toggleNodeSelection", "Node not selected, will select");
      this.addNodeToSelection(nodeId, options);
    }

    this.log.exit("toggleNodeSelection");
  }

  /**
   * Select edge
   *
   * @param {string} edgeId - Edge to select
   * @param {Object} [options] - Optional metadata
   */
  selectEdge(edgeId, options = {}) {
    this.log.enter("selectEdge", { edgeId });

    if (!edgeId || typeof edgeId !== "string") {
      this.log.error("selectEdge", `Invalid edgeId: ${typeof edgeId}`);
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

    this.log.info("selectEdge", `✓ Selected edge '${edgeId}'`);
    this.log.exit("selectEdge");
  }

  /**
   * Get selected node IDs
   *
   * @returns {string[]} Array of selected node IDs
   */
  getSelectedNodeIds() {
    this.log.enter("getSelectedNodeIds");

    const selected = Array.from(
      this.editorState.get("selection.nodeIds", new Set())
    );

    this.log.info("getSelectedNodeIds", `${selected.length} nodes selected`);
    this.log.exit("getSelectedNodeIds");

    return selected;
  }

  /**
   * Get selected edge IDs
   *
   * @returns {string[]} Array of selected edge IDs
   */
  getSelectedEdgeIds() {
    this.log.enter("getSelectedEdgeIds");

    const selected = Array.from(
      this.editorState.get("selection.edgeIds", new Set())
    );

    this.log.info("getSelectedEdgeIds", `${selected.length} edges selected`);
    this.log.exit("getSelectedEdgeIds");

    return selected;
  }

  /**
   * Get all selected entities
   *
   * @returns {Object} Object with nodeIds and edgeIds arrays
   */
  getSelection() {
    this.log.enter("getSelection");

    const selection = {
      nodeIds: this.getSelectedNodeIds(),
      edgeIds: this.getSelectedEdgeIds(),
    };

    this.log.info(
      "getSelection",
      `Selection: ${selection.nodeIds.length} nodes, ${selection.edgeIds.length} edges`
    );
    this.log.exit("getSelection");

    return selection;
  }

  /**
   * Check if node is selected
   *
   * @param {string} nodeId - Node to check
   * @returns {boolean} True if node is selected
   */
  isNodeSelected(nodeId) {
    const selected = this.getSelectedNodeIds().includes(nodeId);
    this.log.info("isNodeSelected", `Node '${nodeId}' selected: ${selected}`);
    return selected;
  }

  /**
   * Clear all selections
   *
   * @param {Object} [options] - Optional metadata
   */
  clearSelection(options = {}) {
    this.log.enter("clearSelection");

    const beforeCount =
      this.getSelectedNodeIds().length + this.getSelectedEdgeIds().length;

    this.editorState.clearSelection({
      reason: options.reason || "selection cleared",
    });

    this.log.info("clearSelection", `✓ Cleared ${beforeCount} selections`);
    this.log.exit("clearSelection");
  }

  /**
   * Select all nodes
   *
   * @param {Object} [options] - Optional metadata
   */
  selectAll(options = {}) {
    this.log.enter("selectAll");

    const allNodeIds = this.editorState.getAllNodes().map((node) => node.id);
    const allEdgeIds = this.editorState.getAllEdges().map((edge) => edge.id);

    this.editorState.setSelection(
      { nodeIds: allNodeIds, edgeIds: allEdgeIds },
      {
        reason: options.reason || "select all",
      }
    );

    this.log.info(
      "selectAll",
      `✓ Selected all: ${allNodeIds.length} nodes, ${allEdgeIds.length} edges`
    );
    this.log.exit("selectAll");
  }

  // ==================== VIEWPORT OPERATIONS ====================

  /**
   * Set viewport interaction mode
   *
   * @param {string} mode - Mode name (select, pan, zoom, etc.)
   * @param {Object} [options] - Optional metadata
   */
  setViewportMode(mode, options = {}) {
    this.log.enter("setViewportMode", { mode });

    if (typeof mode !== "string") {
      this.log.error("setViewportMode", `Invalid mode: ${typeof mode}`);
      throw new Error(
        `StateManager.setViewportMode: Mode must be string, got ${typeof mode}`
      );
    }

    this.editorState.set("viewport.mode", mode, {
      reason: options.reason || `viewport mode changed to ${mode}`,
    });

    this.log.info("setViewportMode", `✓ Mode set to '${mode}'`);
    this.log.exit("setViewportMode");
  }

  /**
   * Get current viewport mode
   *
   * @returns {string} Current mode
   */
  getViewportMode() {
    this.log.enter("getViewportMode");

    const mode = this.editorState.get("viewport.mode", "select");

    this.log.info("getViewportMode", `Current mode: '${mode}'`);
    this.log.exit("getViewportMode");

    return mode;
  }

  /**
   * Set dragging state
   *
   * @param {boolean} isDragging - Is currently dragging?
   * @param {number} [startX] - Drag start X
   * @param {number} [startY] - Drag start Y
   * @param {Object} [options] - Optional metadata
   */
  setDragging(isDragging, startX = 0, startY = 0, options = {}) {
    this.log.enter("setDragging", { isDragging, startX, startY });

    this.editorState.update(
      {
        "viewport.isDragging": isDragging,
        "viewport.dragStartX": startX,
        "viewport.dragStartY": startY,
      },
      {
        reason: options.reason || (isDragging ? "drag started" : "drag ended"),
        silent: true, // Don't emit events for frequent changes
      }
    );

    this.log.info("setDragging", `✓ Dragging: ${isDragging}`);
    this.log.exit("setDragging");
  }

  /**
   * Get dragging state
   *
   * @returns {Object} Dragging state with isDragging, startX, startY
   */
  getDragging() {
    this.log.enter("getDragging");

    const dragging = {
      isDragging: this.editorState.get("viewport.isDragging", false),
      startX: this.editorState.get("viewport.dragStartX", 0),
      startY: this.editorState.get("viewport.dragStartY", 0),
    };

    this.log.info("getDragging", `Dragging: ${dragging.isDragging}`);
    this.log.exit("getDragging");

    return dragging;
  }

  // ==================== THEME OPERATIONS ====================

  /**
   * Set theme
   *
   * @param {string} themeName - Theme name (light, dark, etc.)
   * @param {Object} [options] - Optional metadata
   */
  setTheme(themeName, options = {}) {
    this.log.enter("setTheme", { themeName });

    this.editorState.set("theme.name", themeName, {
      reason: options.reason || `theme changed to ${themeName}`,
    });

    this.log.info("setTheme", `✓ Theme set to '${themeName}'`);
    this.log.exit("setTheme");
  }

  /**
   * Get current theme
   *
   * @returns {string} Current theme name
   */
  getTheme() {
    this.log.enter("getTheme");

    const theme = this.editorState.get("theme.name", "light");

    this.log.info("getTheme", `Current theme: '${theme}'`);
    this.log.exit("getTheme");

    return theme;
  }

  /**
   * Set accent color
   *
   * @param {string} color - Color value (hex, rgb, etc.)
   * @param {Object} [options] - Optional metadata
   */
  setAccentColor(color, options = {}) {
    this.log.enter("setAccentColor", { color });

    this.editorState.set("theme.accentColor", color, {
      reason: options.reason || "accent color changed",
    });

    this.log.info("setAccentColor", `✓ Accent color set to '${color}'`);
    this.log.exit("setAccentColor");
  }

  /**
   * Get accent color
   *
   * @returns {string} Current accent color
   */
  getAccentColor() {
    this.log.enter("getAccentColor");

    const color = this.editorState.get("theme.accentColor", "#0066cc");

    this.log.info("getAccentColor", `Accent color: '${color}'`);
    this.log.exit("getAccentColor");

    return color;
  }

  // ==================== UI OPERATIONS ====================

  /**
   * Set active UI panel
   *
   * @param {string} panelName - Panel to activate
   * @param {Object} [options] - Optional metadata
   */
  setActivePanel(panelName, options = {}) {
    this.log.enter("setActivePanel", { panelName });

    this.editorState.set("ui.activePanel", panelName, {
      reason: options.reason || "active panel changed",
    });

    this.log.info(
      "setActivePanel",
      `✓ Active panel set to '${panelName || "none"}'`
    );
    this.log.exit("setActivePanel");
  }

  /**
   * Get active UI panel
   *
   * @returns {string} Active panel name or null
   */
  getActivePanel() {
    this.log.enter("getActivePanel");

    const panel = this.editorState.get("ui.activePanel", null);

    this.log.info("getActivePanel", `Active panel: '${panel || "none"}'`);
    this.log.exit("getActivePanel");

    return panel;
  }

  /**
   * Toggle grid visibility
   *
   * @param {Object} [options] - Optional metadata
   */
  toggleGrid(options = {}) {
    this.log.enter("toggleGrid");

    const current = this.editorState.get("ui.showGrid", true);
    this.editorState.set("ui.showGrid", !current, {
      reason: options.reason || "grid visibility toggled",
    });

    this.log.info("toggleGrid", `✓ Grid visibility: ${!current}`);
    this.log.exit("toggleGrid");
  }

  /**
   * Toggle guides visibility
   *
   * @param {Object} [options] - Optional metadata
   */
  toggleGuides(options = {}) {
    this.log.enter("toggleGuides");

    const current = this.editorState.get("ui.showGuides", true);
    this.editorState.set("ui.showGuides", !current, {
      reason: options.reason || "guides visibility toggled",
    });

    this.log.info("toggleGuides", `✓ Guides visibility: ${!current}`);
    this.log.exit("toggleGuides");
  }

  /**
   * Toggle snap to grid
   *
   * @param {Object} [options] - Optional metadata
   */
  toggleSnapToGrid(options = {}) {
    this.log.enter("toggleSnapToGrid");

    const current = this.editorState.get("ui.snapToGrid", true);
    this.editorState.set("ui.snapToGrid", !current, {
      reason: options.reason || "snap to grid toggled",
    });

    this.log.info("toggleSnapToGrid", `✓ Snap to grid: ${!current}`);
    this.log.exit("toggleSnapToGrid");
  }

  // ==================== GRAPH QUERIES ====================

  /**
   * Get all nodes
   *
   * @returns {Array} Array of all node data
   */
  getAllNodes() {
    this.log.enter("getAllNodes");

    const nodes = this.editorState.getAllNodes();

    this.log.info("getAllNodes", `Returning ${nodes.length} nodes`);
    this.log.exit("getAllNodes");

    return nodes;
  }

  /**
   * Get node by ID
   *
   * @param {string} nodeId - Node to retrieve
   * @returns {Object} Node data or undefined
   */
  getNode(nodeId) {
    this.log.enter("getNode", { nodeId });

    const node = this.editorState.getNode(nodeId);

    if (node) {
      this.log.info("getNode", `Found node '${nodeId}'`);
    } else {
      this.log.warn("getNode", `Node '${nodeId}' not found`);
    }

    this.log.exit("getNode");
    return node;
  }

  /**
   * Get all edges
   *
   * @returns {Array} Array of all edge data
   */
  getAllEdges() {
    this.log.enter("getAllEdges");

    const edges = this.editorState.getAllEdges();

    this.log.info("getAllEdges", `Returning ${edges.length} edges`);
    this.log.exit("getAllEdges");

    return edges;
  }

  /**
   * Get edge by ID
   *
   * @param {string} edgeId - Edge to retrieve
   * @returns {Object} Edge data or undefined
   */
  getEdge(edgeId) {
    this.log.enter("getEdge", { edgeId });

    const edge = this.editorState.getEdge(edgeId);

    if (edge) {
      this.log.info("getEdge", `Found edge '${edgeId}'`);
    } else {
      this.log.warn("getEdge", `Edge '${edgeId}' not found`);
    }

    this.log.exit("getEdge");
    return edge;
  }

  /**
   * Get edges connected to a node
   *
   * @param {string} nodeId - Node to query
   * @returns {Object} Object with incoming and outgoing edges
   */
  getNodeConnections(nodeId) {
    this.log.enter("getNodeConnections", { nodeId });

    const cacheKey = `connections:${nodeId}`;
    if (this.queryCache.has(cacheKey)) {
      this.log.info("getNodeConnections", "Returning cached result");
      this.log.exit("getNodeConnections");
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

    this.log.info(
      "getNodeConnections",
      `Found ${incoming.length} incoming, ${outgoing.length} outgoing`
    );
    this.log.exit("getNodeConnections");

    return result;
  }

  /**
   * Get node count
   *
   * @returns {number} Number of nodes
   */
  getNodeCount() {
    const count = this.editorState.getAllNodes().length;
    this.log.info("getNodeCount", `Node count: ${count}`);
    return count;
  }

  /**
   * Get edge count
   *
   * @returns {number} Number of edges
   */
  getEdgeCount() {
    const count = this.editorState.getAllEdges().length;
    this.log.info("getEdgeCount", `Edge count: ${count}`);
    return count;
  }

  /**
   * Get selection count
   *
   * @returns {Object} Count of selected nodes and edges
   */
  getSelectionCount() {
    this.log.enter("getSelectionCount");

    const counts = {
      nodes: this.getSelectedNodeIds().length,
      edges: this.getSelectedEdgeIds().length,
    };

    this.log.info(
      "getSelectionCount",
      `Selection: ${counts.nodes} nodes, ${counts.edges} edges`
    );
    this.log.exit("getSelectionCount");

    return counts;
  }

  // ==================== DEBUG & INTROSPECTION ====================

  /**
   * Get complete state summary
   *
   * @returns {Object} Summary of current state
   */
  getSummary() {
    this.log.enter("getSummary");

    const summary = {
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

    this.log.info("getSummary", "Generated state summary");
    this.log.exit("getSummary");

    return summary;
  }

  /**
   * Print state summary to console
   */
  printSummary() {
    this.log.enter("printSummary");

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
    console.log("=".repeat(42));

    this.log.info("printSummary", "Summary printed to console");
    this.log.exit("printSummary");
  }
}

export { StateManager };
