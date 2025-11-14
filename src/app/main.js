/**
 * main.js - Application entry point
 *
 * This is the main initialization file that:
 * - Bootstraps the entire application
 * - Initializes all managers and services
 * - Sets up the editor and UI
 * - Handles global application lifecycle
 */

import { Editor } from "../core/Editor.js";
import { ServiceProvider } from "../core/container/ServiceProvider.js";
import { EventBus } from "../core/events/EventBus.js";
import { StateManager } from "../core/state/StateManager.js";
import { NodeManager } from "../core/managers/NodeManager.js";
import { EdgeManager } from "../core/managers/EdgeManager.js";
import { SelectionManager } from "../core/managers/SelectionManager.js";
import { HistoryManager } from "../core/managers/HistoryManager.js";
import { ClipboardManager } from "../core/managers/ClipboardManager.js";
import { ValidationManager } from "../core/managers/ValidationManager.js";
import { ExportManager } from "../core/managers/ExportManager.js";
import { ThemeManager } from "../core/managers/ThemeManager.js";
import { LayerManager } from "../core/managers/LayerManager.js";
//import { GridManager } from "../core/managers/GridManager.js";
//import { ToolManager } from "../core/managers/ToolManager.js";
import { ShapeRegistry } from "../shapes/registry/ShapeRegistry.js";
import { getAllShapeClasses } from "../shapes/index.js";

/**
 * FlowchartApp - Main application class
 */
class FlowchartApp {
  constructor(containerSelector, options = {}) {
    this.container = document.querySelector(containerSelector);

    if (!this.container) {
      throw new Error(`Container element "${containerSelector}" not found`);
    }

    this.options = {
      // Editor options
      width: options.width || 1920,
      height: options.height || 1080,
      minZoom: options.minZoom || 0.1,
      maxZoom: options.maxZoom || 5,

      // Grid options
      gridEnabled: options.gridEnabled !== false,
      gridSize: options.gridSize || 20,
      snapToGrid: options.snapToGrid || false,

      // History options
      maxHistorySize: options.maxHistorySize || 100,

      // Theme
      theme: options.theme || "light",

      // Features
      features: {
        undo: options.features?.undo !== false,
        clipboard: options.features?.clipboard !== false,
        validation: options.features?.validation !== false,
        export: options.features?.export !== false,
        ...options.features,
      },

      ...options,
    };

    this.editor = null;
    this.serviceProvider = null;
    this.managers = {};
    this.initialized = false;
  }

  /**
   * Initialize the application
   */
  async init() {
    if (this.initialized) {
      console.warn("Application already initialized");
      return;
    }

    try {
      console.log("🚀 Initializing Flowchart Editor...");

      // Step 1: Create service provider and register services
      this._setupServices();

      // Step 2: Initialize editor/canvas
      this._setupEditor();

      // Step 3: Register shapes
      this._registerShapes();

      // Step 4: Setup event handlers
      this._setupEventHandlers();

      // Step 5: Setup keyboard shortcuts
      this._setupKeyboardShortcuts();

      // Step 6: Setup UI (if needed)
      if (this.options.features.ui !== false) {
        this._setupUI();
      }

      // Step 7: Load initial data if provided
      if (this.options.initialData) {
        await this._loadInitialData(this.options.initialData);
      }

      // Step 8: Apply theme
      this.managers.themeManager.setTheme(this.options.theme);

      this.initialized = true;
      console.log("✅ Flowchart Editor initialized successfully");

      // Emit ready event
      this.emit("app:ready");
    } catch (error) {
      console.error("❌ Failed to initialize application:", error);
      throw error;
    }
  }

  /**
   * Setup dependency injection container and register services
   * @private
   */
  _setupServices() {
    console.log("📦 Setting up services...");

    this.serviceProvider = new ServiceProvider();

    // Register core services
    const eventBus = new EventBus();
    const stateManager = new StateManager(eventBus);
    const shapeRegistry = new ShapeRegistry();

    this.serviceProvider.register("eventBus", eventBus, { singleton: true });
    this.serviceProvider.register("stateManager", stateManager, {
      singleton: true,
    });
    this.serviceProvider.register("shapeRegistry", shapeRegistry, {
      singleton: true,
    });

    // Register managers
    this.serviceProvider.register(
      "nodeManager",
      (provider) => {
        return new NodeManager(
          provider.resolve("eventBus"),
          provider.resolve("stateManager"),
          provider.resolve("shapeRegistry")
        );
      },
      { singleton: true }
    );

    this.serviceProvider.register(
      "edgeManager",
      (provider) => {
        return new EdgeManager(
          provider.resolve("eventBus"),
          provider.resolve("stateManager"),
          provider.resolve("nodeManager")
        );
      },
      { singleton: true }
    );

    this.serviceProvider.register(
      "selectionManager",
      (provider) => {
        return new SelectionManager(
          provider.resolve("eventBus"),
          provider.resolve("stateManager")
        );
      },
      { singleton: true }
    );

    this.serviceProvider.register(
      "historyManager",
      (provider) => {
        return new HistoryManager(
          provider.resolve("eventBus"),
          provider.resolve("stateManager"),
          { maxSize: this.options.maxHistorySize }
        );
      },
      { singleton: true }
    );

    this.serviceProvider.register(
      "clipboardManager",
      (provider) => {
        return new ClipboardManager(
          provider.resolve("eventBus"),
          provider.resolve("stateManager"),
          provider.resolve("nodeManager"),
          provider.resolve("edgeManager"),
          provider.resolve("selectionManager")
        );
      },
      { singleton: true }
    );

    this.serviceProvider.register(
      "validationManager",
      (provider) => {
        return new ValidationManager(
          provider.resolve("eventBus"),
          provider.resolve("stateManager"),
          provider.resolve("nodeManager"),
          provider.resolve("edgeManager")
        );
      },
      { singleton: true }
    );

    this.serviceProvider.register(
      "exportManager",
      (provider) => {
        return new ExportManager(
          provider.resolve("eventBus"),
          provider.resolve("stateManager"),
          provider.resolve("nodeManager"),
          provider.resolve("edgeManager")
        );
      },
      { singleton: true }
    );

    this.serviceProvider.register(
      "themeManager",
      (provider) => {
        return new ThemeManager(
          provider.resolve("eventBus"),
          provider.resolve("stateManager")
        );
      },
      { singleton: true }
    );

    this.serviceProvider.register(
      "layerManager",
      (provider) => {
        return new LayerManager(
          provider.resolve("eventBus"),
          provider.resolve("stateManager")
        );
      },
      { singleton: true }
    );

    this.serviceProvider.register(
      "gridManager",
      (provider) => {
        return new GridManager(
          provider.resolve("eventBus"),
          provider.resolve("stateManager"),
          {
            enabled: this.options.gridEnabled,
            size: this.options.gridSize,
            snap: this.options.snapToGrid,
          }
        );
      },
      { singleton: true }
    );

    this.serviceProvider.register(
      "toolManager",
      (provider) => {
        return new ToolManager(
          provider.resolve("eventBus"),
          provider.resolve("stateManager")
        );
      },
      { singleton: true }
    );

    // Resolve all managers
    this.managers = {
      eventBus: this.serviceProvider.resolve("eventBus"),
      stateManager: this.serviceProvider.resolve("stateManager"),
      shapeRegistry: this.serviceProvider.resolve("shapeRegistry"),
      nodeManager: this.serviceProvider.resolve("nodeManager"),
      edgeManager: this.serviceProvider.resolve("edgeManager"),
      selectionManager: this.serviceProvider.resolve("selectionManager"),
      historyManager: this.serviceProvider.resolve("historyManager"),
      clipboardManager: this.serviceProvider.resolve("clipboardManager"),
      validationManager: this.serviceProvider.resolve("validationManager"),
      exportManager: this.serviceProvider.resolve("exportManager"),
      themeManager: this.serviceProvider.resolve("themeManager"),
      layerManager: this.serviceProvider.resolve("layerManager"),
      gridManager: this.serviceProvider.resolve("gridManager"),
      toolManager: this.serviceProvider.resolve("toolManager"),
    };

    console.log("✓ Services registered");
  }

  /**
   * Setup editor instance
   * @private
   */
  _setupEditor() {
    console.log("🎨 Setting up editor...");

    this.editor = new Editor(this.container, {
      width: this.options.width,
      height: this.options.height,
      minZoom: this.options.minZoom,
      maxZoom: this.options.maxZoom,
      gridEnabled: this.options.gridEnabled,
      gridSize: this.options.gridSize,
    });

    // Connect editor to managers
    this.editor.on("canvas:mousedown", this._handleCanvasMouseDown.bind(this));
    this.editor.on("canvas:mousemove", this._handleCanvasMouseMove.bind(this));
    this.editor.on("canvas:mouseup", this._handleCanvasMouseUp.bind(this));
    this.editor.on(
      "canvas:contextmenu",
      this._handleCanvasContextMenu.bind(this)
    );

    console.log("✓ Editor created");
  }

  /**
   * Register all shapes with shape registry
   * @private
   */
  _registerShapes() {
    console.log("📐 Registering shapes...");

    const shapes = getAllShapeClasses();
    let registeredCount = 0;

    Object.entries(shapes).forEach(([id, ShapeClass]) => {
      try {
        this.managers.shapeRegistry.registerShape(id, ShapeClass);
        registeredCount++;
      } catch (error) {
        console.warn(`Failed to register shape "${id}":`, error);
      }
    });

    console.log(`✓ Registered ${registeredCount} shapes`);
  }

  /**
   * Setup global event handlers
   * @private
   */
  _setupEventHandlers() {
    console.log("🔗 Setting up event handlers...");

    const { eventBus, nodeManager, edgeManager, selectionManager } =
      this.managers;

    // Node events
    eventBus.on("node:created", ({ nodeId }) => {
      this._renderNode(nodeId);
    });

    eventBus.on("node:updated", ({ nodeId }) => {
      this._renderNode(nodeId);
    });

    eventBus.on("node:deleted", ({ nodeId }) => {
      this._removeNodeFromCanvas(nodeId);
    });

    // Edge events
    eventBus.on("edge:created", ({ edgeId }) => {
      this._renderEdge(edgeId);
    });

    eventBus.on("edge:updated", ({ edgeId }) => {
      this._renderEdge(edgeId);
    });

    eventBus.on("edge:deleted", ({ edgeId }) => {
      this._removeEdgeFromCanvas(edgeId);
    });

    // Selection events
    eventBus.on("selection:changed", ({ selection }) => {
      this._updateSelectionUI(selection);
    });

    // Viewport events
    this.editor.on("viewport:changed", ({ viewport }) => {
      this._handleViewportChange(viewport);
    });

    console.log("✓ Event handlers registered");
  }

  /**
   * Setup keyboard shortcuts
   * @private
   */
  _setupKeyboardShortcuts() {
    console.log("⌨️  Setting up keyboard shortcuts...");

    const { historyManager, clipboardManager, selectionManager, nodeManager } =
      this.managers;

    document.addEventListener("keydown", (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Ctrl/Cmd + Z
      if (modifier && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (historyManager.canUndo()) {
          historyManager.undo();
        }
      }

      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if (
        (modifier && e.key === "z" && e.shiftKey) ||
        (modifier && e.key === "y")
      ) {
        e.preventDefault();
        if (historyManager.canRedo()) {
          historyManager.redo();
        }
      }

      // Copy: Ctrl/Cmd + C
      if (modifier && e.key === "c") {
        e.preventDefault();
        clipboardManager.copy();
      }

      // Cut: Ctrl/Cmd + X
      if (modifier && e.key === "x") {
        e.preventDefault();
        clipboardManager.cut();
      }

      // Paste: Ctrl/Cmd + V
      if (modifier && e.key === "v") {
        e.preventDefault();
        clipboardManager.paste();
      }

      // Duplicate: Ctrl/Cmd + D
      if (modifier && e.key === "d") {
        e.preventDefault();
        clipboardManager.duplicate();
      }

      // Select All: Ctrl/Cmd + A
      if (modifier && e.key === "a") {
        e.preventDefault();
        const allNodes = nodeManager.getAllNodes().map((n) => n.id);
        selectionManager.selectNodes(allNodes);
      }

      // Delete: Delete or Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const selection = selectionManager.getSelection();
        if (selection.count > 0) {
          this.deleteSelection();
        }
      }

      // Escape: Clear selection
      if (e.key === "Escape") {
        selectionManager.clearSelection();
      }
    });

    console.log("✓ Keyboard shortcuts enabled");
  }

  /**
   * Setup UI components (optional)
   * @private
   */
  _setupUI() {
    // This would initialize toolbar, panels, etc.
    // For now, just a placeholder
    console.log("🎛️  UI components ready");
  }

  /**
   * Load initial data
   * @private
   */
  async _loadInitialData(data) {
    console.log("📂 Loading initial data...");

    try {
      if (typeof data === "string") {
        // Assume it's a JSON string or URL
        if (data.startsWith("http")) {
          const response = await fetch(data);
          data = await response.json();
        } else {
          data = JSON.parse(data);
        }
      }

      this.managers.exportManager.importJSON(JSON.stringify(data));
      console.log("✓ Initial data loaded");
    } catch (error) {
      console.error("Failed to load initial data:", error);
    }
  }

  /**
   * Handle canvas mouse down
   * @private
   */
  _handleCanvasMouseDown({ point, event }) {
    const { nodeManager, edgeManager, selectionManager, toolManager } =
      this.managers;
    const tool = toolManager.getActiveTool();

    // Check if clicked on a node
    const clickedNode = this._getNodeAtPoint(point);

    if (clickedNode) {
      // Node clicked
      if (event.shiftKey) {
        selectionManager.selectNode(clickedNode.id, { mode: "add" });
      } else if (event.ctrlKey || event.metaKey) {
        selectionManager.selectNode(clickedNode.id, { mode: "toggle" });
      } else {
        if (!selectionManager.isNodeSelected(clickedNode.id)) {
          selectionManager.selectNode(clickedNode.id);
        }
        // Start dragging
        this._startDragging(clickedNode, point);
      }
    } else {
      // Canvas clicked - start selection box or create new node based on tool
      if (tool === "select") {
        if (!event.shiftKey) {
          selectionManager.clearSelection();
        }
        this._startSelectionBox(point);
      } else if (tool && tool !== "select" && tool !== "pan") {
        // Create new node
        this.createNode({
          type: tool,
          x: point.x,
          y: point.y,
        });
      }
    }
  }

  /**
   * Handle canvas mouse move
   * @private
   */
  _handleCanvasMouseMove({ point, event }) {
    if (this.isDragging) {
      this._updateDragging(point);
    } else if (this.isSelectionBox) {
      this._updateSelectionBox(point);
    }
  }

  /**
   * Handle canvas mouse up
   * @private
   */
  _handleCanvasMouseUp({ point, event }) {
    if (this.isDragging) {
      this._endDragging();
    } else if (this.isSelectionBox) {
      this._endSelectionBox(point);
    }
  }

  /**
   * Handle canvas context menu
   * @private
   */
  _handleCanvasContextMenu({ point, event }) {
    const clickedNode = this._getNodeAtPoint(point);

    if (clickedNode) {
      this._showNodeContextMenu(clickedNode, point);
    } else {
      this._showCanvasContextMenu(point);
    }
  }

  /**
   * Handle viewport change
   * @private
   */
  _handleViewportChange(viewport) {
    // Update UI elements that depend on viewport
    this.emit("viewport:updated", { viewport });
  }

  /**
   * Render node on canvas
   * @private
   */
  _renderNode(nodeId) {
    const node = this.managers.nodeManager.getNode(nodeId);
    if (!node) return;

    const shapeClass = this.managers.shapeRegistry.getShape(node.type);
    if (!shapeClass) return;

    const shape = new shapeClass({ id: node.type });
    const container = this.editor.getLayer("content");

    // Remove old rendering if exists
    const existing = container.querySelector(`[data-node-id="${nodeId}"]`);
    if (existing) {
      existing.remove();
    }

    // Create new group for node
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("data-node-id", nodeId);
    group.setAttribute("data-node-type", node.type);

    // Render shape
    shape.render(group, node);

    // Add to canvas
    container.appendChild(group);
  }

  /**
   * Remove node from canvas
   * @private
   */
  _removeNodeFromCanvas(nodeId) {
    const container = this.editor.getLayer("content");
    const element = container.querySelector(`[data-node-id="${nodeId}"]`);
    if (element) {
      element.remove();
    }
  }

  /**
   * Render edge on canvas
   * @private
   */
  _renderEdge(edgeId) {
    const edge = this.managers.edgeManager.getEdge(edgeId);
    if (!edge) return;

    const sourceNode = this.managers.nodeManager.getNode(edge.sourceId);
    const targetNode = this.managers.nodeManager.getNode(edge.targetId);

    if (!sourceNode || !targetNode) return;

    const container = this.editor.getLayer("content");

    // Remove old rendering if exists
    const existing = container.querySelector(`[data-edge-id="${edgeId}"]`);
    if (existing) {
      existing.remove();
    }

    // Calculate edge path
    const sourceBounds = this.managers.nodeManager.getNodeBounds(edge.sourceId);
    const targetBounds = this.managers.nodeManager.getNodeBounds(edge.targetId);

    // Simple straight line for now
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("data-edge-id", edgeId);
    line.setAttribute("x1", sourceBounds.centerX);
    line.setAttribute("y1", sourceBounds.centerY);
    line.setAttribute("x2", targetBounds.centerX);
    line.setAttribute("y2", targetBounds.centerY);
    line.setAttribute("stroke", edge.style?.stroke || "#000000");
    line.setAttribute("stroke-width", edge.style?.strokeWidth || 2);
    line.setAttribute("marker-end", "url(#arrowhead)");

    container.insertBefore(line, container.firstChild); // Edges below nodes
  }

  /**
   * Remove edge from canvas
   * @private
   */
  _removeEdgeFromCanvas(edgeId) {
    const container = this.editor.getLayer("content");
    const element = container.querySelector(`[data-edge-id="${edgeId}"]`);
    if (element) {
      element.remove();
    }
  }

  /**
   * Update selection UI
   * @private
   */
  _updateSelectionUI(selection) {
    const overlay = this.editor.getLayer("overlay");

    // Clear existing selection visuals
    const existing = overlay.querySelectorAll(".selection-box");
    existing.forEach((el) => el.remove());

    // Draw selection boxes for selected nodes
    selection.nodes.forEach((nodeId) => {
      const bounds = this.managers.nodeManager.getNodeBounds(nodeId);
      if (!bounds) return;

      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      rect.setAttribute("class", "selection-box");
      rect.setAttribute("x", bounds.x - 2);
      rect.setAttribute("y", bounds.y - 2);
      rect.setAttribute("width", bounds.width + 4);
      rect.setAttribute("height", bounds.height + 4);
      rect.setAttribute("fill", "none");
      rect.setAttribute("stroke", "#2196f3");
      rect.setAttribute("stroke-width", 2);
      rect.setAttribute("stroke-dasharray", "5,5");

      overlay.appendChild(rect);
    });
  }

  /**
   * Get node at point
   * @private
   */
  _getNodeAtPoint(point) {
    const nodes = this.managers.nodeManager.getAllNodes();

    for (const node of nodes) {
      const bounds = this.managers.nodeManager.getNodeBounds(node.id);
      if (
        point.x >= bounds.x &&
        point.x <= bounds.x + bounds.width &&
        point.y >= bounds.y &&
        point.y <= bounds.y + bounds.height
      ) {
        return node;
      }
    }

    return null;
  }

  /**
   * Start dragging nodes
   * @private
   */
  _startDragging(node, startPoint) {
    this.isDragging = true;
    this.dragStartPoint = startPoint;
    this.draggedNodes = this.managers.selectionManager.getSelection().nodes;
    this.dragStartPositions = {};

    this.draggedNodes.forEach((nodeId) => {
      const n = this.managers.nodeManager.getNode(nodeId);
      this.dragStartPositions[nodeId] = { x: n.x, y: n.y };
    });
  }

  /**
   * Update dragging
   * @private
   */
  _updateDragging(point) {
    const dx = point.x - this.dragStartPoint.x;
    const dy = point.y - this.dragStartPoint.y;

    this.draggedNodes.forEach((nodeId) => {
      const startPos = this.dragStartPositions[nodeId];
      let newX = startPos.x + dx;
      let newY = startPos.y + dy;

      // Snap to grid if enabled
      if (this.managers.gridManager.isSnapEnabled()) {
        const gridSize = this.managers.gridManager.getGridSize();
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }

      this.managers.nodeManager.updateNode(nodeId, { x: newX, y: newY });
    });
  }

  /**
   * End dragging
   * @private
   */
  _endDragging() {
    this.isDragging = false;
    // Could add to history here
  }

  /**
   * Start selection box
   * @private
   */
  _startSelectionBox(startPoint) {
    this.isSelectionBox = true;
    this.selectionBoxStart = startPoint;
  }

  /**
   * Update selection box
   * @private
   */
  _updateSelectionBox(point) {
    // Draw selection box rectangle
    const overlay = this.editor.getLayer("overlay");

    let box = overlay.querySelector(".selection-box-rect");
    if (!box) {
      box = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      box.setAttribute("class", "selection-box-rect");
      box.setAttribute("fill", "rgba(33, 150, 243, 0.1)");
      box.setAttribute("stroke", "#2196f3");
      box.setAttribute("stroke-width", 1);
      overlay.appendChild(box);
    }

    const x = Math.min(this.selectionBoxStart.x, point.x);
    const y = Math.min(this.selectionBoxStart.y, point.y);
    const width = Math.abs(point.x - this.selectionBoxStart.x);
    const height = Math.abs(point.y - this.selectionBoxStart.y);

    box.setAttribute("x", x);
    box.setAttribute("y", y);
    box.setAttribute("width", width);
    box.setAttribute("height", height);
  }

  /**
   * End selection box
   * @private
   */
  _endSelectionBox(endPoint) {
    this.isSelectionBox = false;

    // Calculate selection box bounds
    const x = Math.min(this.selectionBoxStart.x, endPoint.x);
    const y = Math.min(this.selectionBoxStart.y, endPoint.y);
    const width = Math.abs(endPoint.x - this.selectionBoxStart.x);
    const height = Math.abs(endPoint.y - this.selectionBoxStart.y);

    // Find nodes within selection box
    const nodes = this.managers.nodeManager.getAllNodes();
    const selectedNodes = nodes
      .filter((node) => {
        const bounds = this.managers.nodeManager.getNodeBounds(node.id);
        return (
          bounds.x >= x &&
          bounds.y >= y &&
          bounds.x + bounds.width <= x + width &&
          bounds.y + bounds.height <= y + height
        );
      })
      .map((n) => n.id);

    if (selectedNodes.length > 0) {
      this.managers.selectionManager.selectNodes(selectedNodes, {
        mode: "add",
      });
    }

    // Remove selection box visual
    const overlay = this.editor.getLayer("overlay");
    const box = overlay.querySelector(".selection-box-rect");
    if (box) {
      box.remove();
    }
  }

  /**
   * Show node context menu
   * @private
   */
  _showNodeContextMenu(node, point) {
    // Implement context menu
    console.log("Show node context menu", node, point);
  }

  /**
   * Show canvas context menu
   * @private
   */
  _showCanvasContextMenu(point) {
    // Implement context menu
    console.log("Show canvas context menu", point);
  }

  // ==================== Public API ====================

  /**
   * Create a new node
   */
  createNode(data) {
    return this.managers.nodeManager.createNode(data);
  }

  /**
   * Create a new edge
   */
  createEdge(data) {
    return this.managers.edgeManager.createEdge(data);
  }

  /**
   * Delete selected items
   */
  deleteSelection() {
    const selection = this.managers.selectionManager.getSelection();

    // Delete edges first
    selection.edges.forEach((edgeId) => {
      this.managers.edgeManager.deleteEdge(edgeId);
    });

    // Delete nodes
    selection.nodes.forEach((nodeId) => {
      this.managers.nodeManager.deleteNode(nodeId);
    });

    this.managers.selectionManager.clearSelection();
  }

  /**
   * Export diagram as JSON
   */
  exportJSON() {
    return this.managers.exportManager.exportJSON();
  }

  /**
   * Import diagram from JSON
   */
  importJSON(json) {
    return this.managers.exportManager.importJSON(json);
  }

  /**
   * Export diagram as SVG
   */
  exportSVG() {
    return this.editor.exportSVG();
  }

  /**
   * Clear all content
   */
  clear() {
    this.managers.nodeManager.clearAll();
    this.managers.edgeManager.clearAll();
    this.managers.selectionManager.clearSelection();
    this.managers.historyManager.clear();
    this.editor.clear();
  }

  /**
   * Validate diagram
   */
  validate() {
    return this.managers.validationManager.validate();
  }

  /**
   * Fit content to viewport
   */
  fitToContent() {
    this.editor.fitToContent();
  }

  /**
   * Zoom to specific level
   */
  zoom(level) {
    this.editor.setZoom(level);
  }

  /**
   * Reset viewport
   */
  resetViewport() {
    this.editor.resetViewport();
  }

  /**
   * Get manager instance
   */
  getManager(name) {
    return this.managers[name];
  }

  /**
   * Get editor instance
   */
  getEditor() {
    return this.editor;
  }

  /**
   * Emit custom event
   */
  emit(event, data) {
    this.managers.eventBus.emit(event, data);
  }

  /**
   * Listen to event
   */
  on(event, handler) {
    this.managers.eventBus.on(event, handler);
  }

  /**
   * Remove event listener
   */
  off(event, handler) {
    this.managers.eventBus.off(event, handler);
  }

  /**
   * Destroy application
   */
  destroy() {
    console.log("🗑️  Destroying application...");

    // Destroy all managers
    Object.values(this.managers).forEach((manager) => {
      if (manager && typeof manager.destroy === "function") {
        manager.destroy();
      }
    });

    // Destroy editor
    if (this.editor) {
      this.editor.destroy();
    }

    this.initialized = false;
    console.log("✅ Application destroyed");
  }
}

/**
 * Create and initialize application
 */
export async function createFlowchartApp(containerSelector, options = {}) {
  const app = new FlowchartApp(containerSelector, options);
  await app.init();
  return app;
}

// Export app class
export { FlowchartApp };

// Auto-initialize if data-flowchart attribute is present
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    const containers = document.querySelectorAll("[data-flowchart]");
    containers.forEach((container) => {
      const options = container.dataset.flowchartOptions
        ? JSON.parse(container.dataset.flowchartOptions)
        : {};

      createFlowchartApp(`#${container.id}`, options)
        .then((app) => {
          // Store app instance on container
          container.flowchartApp = app;
        })
        .catch((error) => {
          console.error("Failed to initialize flowchart app:", error);
        });
    });
  });
}
