/**
 * Flowchart Editor - Main Application Entry Point
 * Bootstraps the entire application with all services, layers, and components
 */

import { ServiceProvider } from "../core/container/ServiceProvider.js";
import { EventBus } from "../core/events/EventBus.js";
import { StateManager } from "../core/state/StateManager.js";
import { Editor } from "../core/Editor.js";
import { ShapeRegistry } from "../shapes/registry/ShapeRegistry.js";
import { getAllShapeClasses } from "../shapes/index.js";

// Managers
import { NodeManager } from "../core/managers/NodeManager.js";
import { EdgeManager } from "../core/managers/EdgeManager.js";
import { SelectionManager } from "../core/managers/SelectionManager.js";
import { HistoryManager } from "../core/managers/HistoryManager.js";
import { ClipboardManager } from "../core/managers/ClipboardManager.js";
//import { GridManager } from "../core/managers/GridManager.js";
import { ValidationManager } from "../core/managers/ValidationManager.js";
import { ThemeManager } from "../core/managers/ThemeManager.js";
import { ExportManager } from "../core/managers/ExportManager.js";
import { LayerManager } from "../core/managers/LayerManager.js";
//import { ToolManager } from "../core/managers/ToolManager.js";

class FlowchartApp {
  constructor() {
    this.container = null;
    this.services = null;
    this.eventBus = null;
    this.stateManager = null;
    this.editor = null;
    this.managers = {};
    this.ui = {};
  }

  /**
   * Initialize and bootstrap the entire application
   */
  async initialize() {
    console.log("🚀 Initializing Flowchart Editor...");

    // Step 1: Create DOM structure
    this._createDOMStructure();

    // Step 2: Setup dependency injection container
    this._setupServiceContainer();

    // Step 3: Load built-in shapes
    await this._loadShapes();

    // Step 4: Initialize UI components
    this._setupUI();

    // Step 5: Setup event handlers and connections
    this._setupEventHandlers();

    // Step 6: Initialize workspace
    this._initializeWorkspace();

    console.log("✅ Flowchart Editor initialized successfully");
    return this;
  }

  /**
   * Create the DOM structure for the application
   */
  _createDOMStructure() {
    const appContainer = document.getElementById("app");
    appContainer.innerHTML = `
      <div class="flowchart-editor-container">
        <!-- Menu Bar -->
        <div id="menu-bar" class="menu-bar"></div>

        <!-- Main Content Area -->
        <div class="main-content">
          <!-- Left Palette -->
          <div id="left-panel" class="side-panel left-panel">
            <div class="panel-header">Shapes</div>
            <div id="shape-palette" class="shape-palette"></div>
          </div>

          <!-- Editor Area -->
          <div class="editor-area">
            <!-- Tool Bar -->
            <div id="tool-bar" class="tool-bar"></div>

            <!-- Editor Canvas -->
            <div id="editor-container" class="editor-container">
              <svg id="editor-svg" class="editor-svg"></svg>
            </div>

            <!-- Mini Map -->
            <div id="mini-map" class="mini-map"></div>
          </div>

          <!-- Right Inspector -->
          <div id="right-panel" class="side-panel right-panel">
            <div class="panel-tabs">
              <button class="tab-button active" data-tab="inspector">Inspector</button>
              <button class="tab-button" data-tab="layers">Layers</button>
            </div>
            <div id="inspector-panel" class="panel-content inspector-panel"></div>
            <div id="layers-panel" class="panel-content layers-panel" style="display: none;"></div>
          </div>
        </div>

        <!-- Status Bar -->
        <div id="status-bar" class="status-bar"></div>

        <!-- Context Menu -->
        <div id="context-menu" class="context-menu" style="display: none;"></div>

        <!-- Dialogs -->
        <div id="dialogs-container" class="dialogs-container"></div>
      </div>
    `;
  }

  /**
   * Setup the dependency injection service container
   */
  _setupServiceContainer() {
    // Create service provider
    this.services = new ServiceProvider();

    this.services.register("eventBus", this.eventBus, { singleton: true });
    this.services.register("stateManager", this.stateManager, {
      singleton: true,
    });
    // Register core services
    this.eventBus = new EventBus();
    this.stateManager = new StateManager(this.eventBus);
    const shapeRegistry = new ShapeRegistry();

    this.services.register("shapeRegistry", shapeRegistry, { singleton: true });

    // Register managers
    this.services.register(
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

    this.services.register(
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

    this.services.register(
      "selectionManager",
      (provider) => {
        return new SelectionManager(
          provider.resolve("eventBus"),
          provider.resolve("stateManager")
        );
      },
      { singleton: true }
    );

    this.services.register(
      "historyManager",
      (provider) => {
        return new HistoryManager(
          provider.resolve("eventBus"),
          provider.resolve("stateManager")
        );
      },
      { singleton: true }
    );

    this.services.register(
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

    this.services.register(
      "gridManager",
      (provider) => {
        return new GridManager(
          provider.resolve("eventBus"),
          provider.resolve("stateManager")
        );
      },
      { singleton: true }
    );

    this.services.register(
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

    this.services.register(
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

    this.services.register(
      "themeManager",
      (provider) => {
        return new ThemeManager(
          provider.resolve("eventBus"),
          provider.resolve("stateManager")
        );
      },
      { singleton: true }
    );

    this.services.register(
      "layerManager",
      (provider) => {
        return new LayerManager(
          provider.resolve("eventBus"),
          provider.resolve("stateManager")
        );
      },
      { singleton: true }
    );

    this.services.register(
      "toolManager",
      (provider) => {
        return new ToolManager(
          provider.resolve("eventBus"),
          provider.resolve("stateManager")
        );
      },
      { singleton: true }
    );

    // Register Editor
    this.services.register(
      "editor",
      () => {
        return new Editor(null, {
          gridEnabled: true,
          gridSize: 20,
        });
      },
      { singleton: true }
    );

    console.log("📦 Services registered");
  }

  /**
   * Load shapes into the registry
   */
  async _loadShapes() {
    const shapeRegistry = this.services.resolve("shapeRegistry");
    const shapes = getAllShapeClasses();

    let registeredCount = 0;
    Object.entries(shapes).forEach(([id, ShapeClass]) => {
      try {
        shapeRegistry.registerShape(id, ShapeClass);
        registeredCount++;
      } catch (error) {
        console.warn(`Failed to register shape "${id}":`, error);
      }
    });

    console.log(`📐 Shapes loaded: ${registeredCount} shapes`);
  }

  /**
   * Setup all UI components
   */
  _setupUI() {
    // Get editor and managers
    this.editor = this.services.resolve("editor");
    this.editor.container = document.getElementById("editor-container");
    this.editor.svgElement = document.getElementById("editor-svg");
    this.editor._createLayers();

    // Get manager instances
    this.managers = {
      node: this.services.resolve("nodeManager"),
      edge: this.services.resolve("edgeManager"),
      selection: this.services.resolve("selectionManager"),
      history: this.services.resolve("historyManager"),
      clipboard: this.services.resolve("clipboardManager"),
      grid: this.services.resolve("gridManager"),
      validation: this.services.resolve("validationManager"),
      theme: this.services.resolve("themeManager"),
      export: this.services.resolve("exportManager"),
      layer: this.services.resolve("layerManager"),
      tool: this.services.resolve("toolManager"),
    };

    // Initialize UI components (placeholders for now)
    this._initMenuBar();
    this._initToolBar();
    this._initShapePalette();
    this._initInspector();
    this._initLayersPanel();
    this._initStatusBar();
    this._initMiniMap();

    console.log("🎨 UI components initialized");
  }

  /**
   * Initialize menu bar
   */
  _initMenuBar() {
    const menuBar = document.getElementById("menu-bar");
    menuBar.innerHTML = `
      <div class="menu-items">
        <button class="menu-item" data-action="new">File</button>
        <button class="menu-item" data-action="edit">Edit</button>
        <button class="menu-item" data-action="view">View</button>
        <button class="menu-item" data-action="help">Help</button>
      </div>
    `;
  }

  /**
   * Initialize tool bar
   */
  _initToolBar() {
    const toolBar = document.getElementById("tool-bar");
    toolBar.innerHTML = `
      <div class="tool-group">
        <button class="tool-btn active" data-tool="select" title="Select (V)">
          <span>✋</span>
        </button>
        <button class="tool-btn" data-tool="pan" title="Pan (H)">
          <span>✊</span>
        </button>
      </div>
      <div class="tool-divider"></div>
      <div class="tool-group">
        <button class="tool-btn" data-action="undo" title="Undo (Ctrl+Z)">
          <span>↶</span>
        </button>
        <button class="tool-btn" data-action="redo" title="Redo (Ctrl+Y)">
          <span>↷</span>
        </button>
      </div>
      <div class="tool-divider"></div>
      <div class="tool-group">
        <button class="tool-btn" data-action="zoom-in" title="Zoom In">
          <span>🔍+</span>
        </button>
        <button class="tool-btn" data-action="zoom-out" title="Zoom Out">
          <span>🔍-</span>
        </button>
        <button class="tool-btn" data-action="fit" title="Fit to Screen">
          <span>⛶</span>
        </button>
      </div>
    `;

    // Tool button handlers
    toolBar.querySelectorAll("[data-tool]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tool = e.currentTarget.dataset.tool;
        this.managers.tool.setActiveTool(tool);
        toolBar
          .querySelectorAll("[data-tool]")
          .forEach((b) => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
      });
    });

    // Action button handlers
    toolBar
      .querySelector('[data-action="undo"]')
      ?.addEventListener("click", () => {
        this.managers.history.undo();
      });

    toolBar
      .querySelector('[data-action="redo"]')
      ?.addEventListener("click", () => {
        this.managers.history.redo();
      });

    toolBar
      .querySelector('[data-action="zoom-in"]')
      ?.addEventListener("click", () => {
        const current = this.editor.viewport.zoom;
        this.editor.setZoom(current + 0.1);
      });

    toolBar
      .querySelector('[data-action="zoom-out"]')
      ?.addEventListener("click", () => {
        const current = this.editor.viewport.zoom;
        this.editor.setZoom(current - 0.1);
      });

    toolBar
      .querySelector('[data-action="fit"]')
      ?.addEventListener("click", () => {
        this.editor.fitToContent();
      });
  }

  /**
   * Initialize shape palette
   */
  _initShapePalette() {
    const palette = document.getElementById("shape-palette");
    const shapes = [
      { id: "polygon", name: "Polygon", icon: "⬡" },
      { id: "star", name: "Star", icon: "⭐" },
      { id: "cloud", name: "Cloud", icon: "☁️" },
      { id: "database", name: "Database", icon: "🗄️" },
      { id: "class", name: "Class", icon: "📦" },
    ];

    palette.innerHTML = shapes
      .map(
        (shape) => `
      <div class="shape-item" data-shape="${shape.id}">
        <div class="shape-icon">${shape.icon}</div>
        <div class="shape-name">${shape.name}</div>
      </div>
    `
      )
      .join("");

    // Shape selection handlers
    palette.querySelectorAll(".shape-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const shapeId = e.currentTarget.dataset.shape;
        this.managers.tool.setActiveTool(shapeId);
        this.eventBus.emit("shape:selected", { type: shapeId });
      });
    });
  }

  /**
   * Initialize inspector panel
   */
  _initInspector() {
    const inspector = document.getElementById("inspector-panel");
    inspector.innerHTML = `
      <div class="inspector-empty">
        <p>Select an element to view properties</p>
      </div>
    `;
  }

  /**
   * Initialize layers panel
   */
  _initLayersPanel() {
    const layersPanel = document.getElementById("layers-panel");
    layersPanel.innerHTML = `
      <div class="layers-list">
        <div class="layer-item">
          <span class="layer-name">Layer 1</span>
        </div>
      </div>
    `;

    // Panel tab switching
    document.querySelectorAll(".tab-button").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tab = e.currentTarget.dataset.tab;
        document
          .querySelectorAll(".tab-button")
          .forEach((b) => b.classList.remove("active"));
        e.currentTarget.classList.add("active");

        document.getElementById("inspector-panel").style.display =
          tab === "inspector" ? "block" : "none";
        document.getElementById("layers-panel").style.display =
          tab === "layers" ? "block" : "none";
      });
    });
  }

  /**
   * Initialize status bar
   */
  _initStatusBar() {
    const statusBar = document.getElementById("status-bar");
    statusBar.innerHTML = `
      <div class="status-left">
        <span id="status-message">Ready</span>
      </div>
      <div class="status-right">
        <span id="status-selection">Selected: 0</span>
        <span class="status-divider">|</span>
        <span id="status-zoom">Zoom: 100%</span>
      </div>
    `;
  }

  /**
   * Initialize mini map
   */
  _initMiniMap() {
    const miniMap = document.getElementById("mini-map");
    miniMap.innerHTML = `
      <canvas class="minimap-canvas" width="200" height="150"></canvas>
    `;
  }

  /**
   * Setup event handlers and inter-component communication
   */
  _setupEventHandlers() {
    // Handle shape selection from palette
    this.eventBus.on("shape:selected", (data) => {
      console.log(`📌 Drawing mode: ${data.type}`);
    });

    // Handle node creation
    this.eventBus.on("node:created", (node) => {
      console.log(`Node created: ${node.id}`);
      this._updateStatusMessage(`Node created: ${node.id}`);
    });

    // Handle node selection
    this.eventBus.on("node:selected", (node) => {
      console.log(`Node selected: ${node.id}`);
    });

    // Handle edge creation
    this.eventBus.on("edge:created", (edge) => {
      console.log(`Connection created: ${edge.id}`);
      this._updateStatusMessage(`Connection created: ${edge.id}`);
    });

    // Handle selection changes
    this.eventBus.on("selection:changed", (selection) => {
      const count =
        (selection.nodes?.length || 0) + (selection.edges?.length || 0);
      this._updateSelectionCount(count);
    });

    // Handle pan/zoom changes
    this.eventBus.on("viewport:changed", (viewport) => {
      this._updateZoom(viewport.zoom);
    });

    console.log("🔗 Event handlers connected");
  }

  /**
   * Update status message
   */
  _updateStatusMessage(message) {
    const statusMessage = document.getElementById("status-message");
    if (statusMessage) {
      statusMessage.textContent = message;
    }
  }

  /**
   * Update selection count
   */
  _updateSelectionCount(count) {
    const statusSelection = document.getElementById("status-selection");
    if (statusSelection) {
      statusSelection.textContent = `Selected: ${count}`;
    }
  }

  /**
   * Update zoom level
   */
  _updateZoom(zoom) {
    const statusZoom = document.getElementById("status-zoom");
    if (statusZoom) {
      statusZoom.textContent = `Zoom: ${Math.round(zoom * 100)}%`;
    }
  }

  /**
   * Initialize the workspace with default settings
   */
  _initializeWorkspace() {
    // Set default theme
    this.managers.theme.setTheme("light");

    // Setup grid
    this.managers.grid.setGridSize(20);
    this.managers.grid.enable();

    // Initialize viewport
    this.editor.resetViewport();

    // Setup keyboard shortcuts
    this._setupKeyboardShortcuts();

    console.log("⚙️ Workspace initialized");
  }

  /**
   * Setup global keyboard shortcuts
   */
  _setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + Z: Undo
      if (modifier && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (this.managers.history.canUndo()) {
          this.managers.history.undo();
        }
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
      if (
        (modifier && e.key === "z" && e.shiftKey) ||
        (modifier && e.key === "y")
      ) {
        e.preventDefault();
        if (this.managers.history.canRedo()) {
          this.managers.history.redo();
        }
      }

      // Ctrl/Cmd + C: Copy
      if (modifier && e.key === "c") {
        e.preventDefault();
        this.managers.clipboard.copy();
      }

      // Ctrl/Cmd + X: Cut
      if (modifier && e.key === "x") {
        e.preventDefault();
        this.managers.clipboard.cut();
      }

      // Ctrl/Cmd + V: Paste
      if (modifier && e.key === "v") {
        e.preventDefault();
        this.managers.clipboard.paste();
      }

      // Ctrl/Cmd + D: Duplicate
      if (modifier && e.key === "d") {
        e.preventDefault();
        this.managers.clipboard.duplicate();
      }

      // Delete or Backspace: Remove selected
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const selection = this.managers.selection.getSelection();
        if (selection.nodes) {
          selection.nodes.forEach((nodeId) => {
            this.managers.node.deleteNode(nodeId);
          });
        }
        if (selection.edges) {
          selection.edges.forEach((edgeId) => {
            this.managers.edge.deleteEdge(edgeId);
          });
        }
      }

      // Ctrl/Cmd + A: Select all
      if (modifier && e.key === "a") {
        e.preventDefault();
        const nodes = this.managers.node.getAllNodes();
        const edges = this.managers.edge.getAllEdges();
        nodes.forEach((node) =>
          this.managers.selection.selectNode(node.id, { mode: "add" })
        );
        edges.forEach((edge) =>
          this.managers.selection.selectEdge(edge.id, { mode: "add" })
        );
      }

      // Escape: Clear selection
      if (e.key === "Escape") {
        this.managers.selection.clearSelection();
      }
    });
  }

  /**
   * Export current diagram
   */
  async exportDiagram(format = "json") {
    return this.managers.export.exportJSON();
  }

  /**
   * Import diagram from data
   */
  async importDiagram(data, format = "json") {
    return this.managers.export.importJSON(data);
  }

  /**
   * Get the state manager
   */
  getStateManager() {
    return this.stateManager;
  }

  /**
   * Get a specific manager
   */
  getManager(name) {
    return this.managers[name];
  }

  /**
   * Get a service
   */
  getService(name) {
    return this.services.resolve(name);
  }

  /**
   * Get the editor instance
   */
  getEditor() {
    return this.editor;
  }
}

// Initialize the application when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
  const app = new FlowchartApp();
  await app.initialize();
  window.flowchartApp = app; // Expose for debugging
});

export { FlowchartApp };
