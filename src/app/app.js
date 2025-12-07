import { DebugLogger, DebugControl } from "../utils/debug/DebugLogger.js";
import { DOMUtils } from "../utils/dom/dom.js";
import { ServiceContainer } from "../core/container/ServiceContainer.js";
import { ServiceProvider } from "../core/container/ServiceProvider.js";
import { ShapeLoader } from "../shapes/loader/index.js";

// UI Components
import { ToolBar } from "../ui/bars/ToolBar.js";
import { MenuBar } from "../ui/bars/MenuBar.js";
import { StatusBar } from "../ui/bars/StatusBar.js";
import { LeftPalette } from "../ui/panels/LeftPalette.js";
import { RightInspector, LayersPanel, MiniMap } from "../ui/panels/Panels.js";

/**
 * FlowchartApp - Main Application Class
 *
 * Initializes the flowchart editor application, sets up the UI,
 * and manages core services via a dependency injection container.
 *
 * @module app/FlowchartApp
 */
export class FlowchartApp {
  constructor(options = {}) {
    this.options = {
      theme: "light",
      debug: false,
      ...options,
    };

    // Enable debug mode if requested
    if (this.options.debug) {
      DebugControl.enableGlobal();
    } else {
      DebugControl.disableGlobal();
    }

    this.log = new DebugLogger("FlowchartApp", "#E91E63");
    this.log.enable();
    this.log.enter("constructor");

    // Dependency Injection Container
    this.container = new ServiceContainer();

    // UI
    this.ui = {};

    // Connection state for edge creation
    this.connectingFrom = null;
    this.resizing = null;

    this.log.info("constructor", "✓ FlowchartApp instance created");
    this.log.exit("constructor");
  }

  async initialize() {
    this.log.enter("initialize");

    try {
      // Step 1: Create DOM structure
      this.log.info("initialize", "Step 1: Creating DOM structure...");
      this.createDOMStructure();

      // Step 2: Register services with DI container
      this.log.info("initialize", "Step 2: Registering services...");
      ServiceProvider.register(this.container);

      // Step 3: Resolve core services using container.get()
      this.log.info("initialize", "Step 3: Resolving core services...");
      this.eventBus = this.container.get("eventBus");
      this.editorState = this.container.get("editorState"); // For debugging only
      this.stateManager = this.container.get("stateManager"); // ← Main interface
      this.shapeRegistry = this.container.get("shapeRegistry");

      this.log.info("initialize", "✓ Core services resolved");
      this.log.info("initialize", "  - EventBus: ✓");
      this.log.info("initialize", "  - EditorState: ✓ (storage layer)");
      this.log.info("initialize", "  - StateManager: ✓ (API layer - USE THIS)");
      this.log.info("initialize", "  - ShapeRegistry: ✓");

      // Step 4: Load shapes
      this.log.info("initialize", "Step 4: Loading shapes...");
      const shapeLoader = new ShapeLoader(this.shapeRegistry);
      await shapeLoader.loadBuiltInShapes();
      const shapeStats = this.shapeRegistry.getStats();
      this.log.info(
        "initialize",
        `✓ Loaded ${shapeStats.totalShapes} shapes across ${
          Object.keys(shapeStats.categories).length
        } categories`
      );

      // Step 5: Setup UI components
      this.log.info("initialize", "Step 5: Setting up UI...");
      this.setupUI();

      // Step 6: Setup editor and managers
      this.log.info("initialize", "Step 6: Setting up editor and managers...");
      this.setupEditor();

      // Step 7: Setup event handlers
      this.log.info("initialize", "Step 7: Setting up event handlers...");
      this.setupEventHandlers();

      // Step 8: Initial state setup
      this.log.info("initialize", "Step 8: Setting initial state...");
      this.stateManager.setTheme(this.options.theme);
      this.stateManager.setZoom(1.0);
      this.stateManager.setPan(0, 0);

      this.log.info("initialize", "");
      this.log.info("initialize", "✅ FlowchartApp initialized successfully!");
      this.log.info("initialize", "");
      this.log.info("initialize", "State Management Architecture:");
      this.log.info(
        "initialize",
        "  EditorState = Storage (Maps, Sets, objects)"
      );
      this.log.info(
        "initialize",
        "  StateManager = API (ONLY interface to state)"
      );
      this.log.info(
        "initialize",
        "  ⚠️  Use stateManager for ALL state operations"
      );
      this.log.info("initialize", "");

      this.log.exit("initialize");
      return true;
    } catch (error) {
      this.log.error(
        "initialize",
        `❌ Initialization failed: ${error.message}`
      );
      this.log.error("initialize", error.stack);
      throw error;
    }
  }

  createDOMStructure() {
    this.log.enter("createDOMStructure");

    const appContainer = document.getElementById("app");
    if (!appContainer) {
      throw new Error("Container element #app not found");
    }

    // Create top-level container
    const flowchartEditorContainer = DOMUtils.createElement("div", {
      classes: "flowchart-editor-container",
    });

    // <! -- Menu Bar -->
    const menuBar = DOMUtils.createElement("div", {
      classes: "menu-bar",
      attributes: { id: "menu-bar" },
    });
    flowchartEditorContainer.appendChild(menuBar);

    // <! -- Tool Bar -->
    const toolBar = DOMUtils.createElement("div", {
      classes: "tool-bar",
      attributes: { id: "tool-bar" },
    });
    flowchartEditorContainer.appendChild(toolBar);

    // <! -- Main Content Area -->
    const mainContent = DOMUtils.createElement("div", {
      classes: "main-content",
    });

    // <! -- Left Palette -->
    const leftPanel = DOMUtils.createElement("div", {
      classes: "side-panel left-panel",
      attributes: { id: "left-panel" },
    });
    const leftPanelHeader = DOMUtils.createElement("div", {
      classes: "panel-header",
    });
    leftPanelHeader.textContent = "Shapes";
    const shapePalette = DOMUtils.createElement("div", {
      classes: "shape-palette",
      attributes: { id: "shape-palette" },
    });
    leftPanel.appendChild(leftPanelHeader);
    leftPanel.appendChild(shapePalette);
    mainContent.appendChild(leftPanel);

    // <! -- Editor Area -->
    const editorArea = DOMUtils.createElement("div", {
      classes: "editor-area",
    });

    // <! -- Editor Canvas Container -->
    const editorContainer = DOMUtils.createElement("div", {
      classes: "editor-container",
      attributes: { id: "editor-container" },
    });
    editorArea.appendChild(editorContainer);

    // <! -- Mini Map -->
    const miniMap = DOMUtils.createElement("div", {
      classes: "mini-map",
      attributes: { id: "mini-map" },
    });
    // editorArea.appendChild(miniMap);

    mainContent.appendChild(editorArea);

    // <! -- Right Inspector -->
    const rightPanel = DOMUtils.createElement("div", {
      classes: "side-panel right-panel",
      attributes: { id: "right-panel" },
    });
    const panelTabs = DOMUtils.createElement("div", {
      classes: "panel-tabs",
    });
    const inspectorTab = DOMUtils.createElement("button", {
      classes: "tab-button active",
      attributes: { "data-tab": "inspector" },
    });
    inspectorTab.dataset.tab = "inspector";
    inspectorTab.textContent = "Inspector";
    const layersTab = DOMUtils.createElement("button", {
      classes: "tab-button",
      attributes: { "data-tab": "layers" },
    });
    layersTab.dataset.tab = "layers";
    layersTab.textContent = "Layers";
    panelTabs.appendChild(inspectorTab);
    panelTabs.appendChild(layersTab);
    const inspectorPanel = DOMUtils.createElement("div", {
      classes: "panel-content inspector-panel",
      attributes: { id: "inspector-panel" },
    });
    const layersPanel = DOMUtils.createElement("div", {
      classes: "panel-content layers-panel",
      attributes: { id: "layers-panel" },
      style: { display: "none" },
    });
    rightPanel.appendChild(panelTabs);
    rightPanel.appendChild(inspectorPanel);
    rightPanel.appendChild(layersPanel);
    mainContent.appendChild(rightPanel);
    flowchartEditorContainer.appendChild(mainContent);

    // <! -- Status Bar -->
    const statusBar = DOMUtils.createElement("div", {
      classes: "status-bar",
      attributes: { id: "status-bar" },
    });
    flowchartEditorContainer.appendChild(statusBar);

    // <! -- Context Menu -->
    const contextMenu = DOMUtils.createElement("div", {
      classes: "context-menu",
      attributes: { id: "context-menu" },
      style: { display: "none" },
    });
    flowchartEditorContainer.appendChild(contextMenu);

    // <! -- Dialogs -->
    const dialogsContainer = DOMUtils.createElement("div", {
      classes: "dialogs-container",
      attributes: { id: "dialogs-container" },
      style: { display: "none" },
    });

    flowchartEditorContainer.appendChild(dialogsContainer);

    this.ui = {
      flowchartEditorContainer,
      menuBar,
      leftPanel,
      leftPanelHeader,
      shapePalette,
      mainContent,
      editorArea,
      toolBar,
      editorContainer,
      miniMap,
      rightPanel,
      panelTabs,
      inspectorTab,
      layersTab,
      inspectorPanel,
      layersPanel,
      statusBar,
      contextMenu,
      dialogsContainer,
    };

    appContainer.appendChild(this.ui.flowchartEditorContainer);

    this.log.exit("createDOMStructure");
  }

  setupUI() {
    this.log.enter("setupUI");

    this.log.stage("Initializing MenuBar");
    const menuBar = new MenuBar(this.eventBus, this.stateManager);
    menuBar.initialize(this.ui.menuBar);

    this.log.stage("Initializing ToolBar");
    const toolBar = new ToolBar(this.eventBus, this.stateManager);
    toolBar.initialize(this.ui.toolBar);

    this.log.stage("Initializing StatusBar");
    const statusBar = new StatusBar(this.eventBus, this.stateManager);
    statusBar.initialize(this.ui.statusBar);

    this.log.stage("Initializing LeftPalette");
    const leftPalette = new LeftPalette(this.shapeRegistry, this.eventBus);
    leftPalette.initialize(this.ui.shapePalette);

    this.log.stage("Initializing RightInspector");
    const rightInspector = new RightInspector(this.eventBus, this.stateManager);
    rightInspector.initialize(this.ui.inspectorPanel);

    this.log.stage("Initializing MiniMap");
    const miniMap = new MiniMap(this.eventBus, this.stateManager);
    miniMap.initialize(this.ui.miniMap);

    this.log.info("setupUI", "✓ UI components initialized");
    this.log.exit("setupUI");
  }

  /**
   * Step 6: Initialize Editor and get Managers
   */
  setupEditor() {
    this.log.enter("setupEditor");

    // Resolve editor using container.get()
    this.editor = this.container.get("editor");
    this.editor.initialize(this.ui.editorContainer);
    this.log.info("setupEditor", "✓ Editor initialized");

    // Resolve managers using container.get()
    this.nodeManager = this.container.get("nodeManager");
    this.edgeManager = this.container.get("edgeManager");
    this.log.info("setupEditor", "✓ Managers resolved");
    this.log.exit("setupEditor");
  }

  /**
   * Step 7: Setup Event Handlers
   */
  setupEventHandlers() {
    this.log.enter("setupEventHandlers");

    // ========================================================================
    // SHAPE DROPPED EVENT - Create node when shape is dropped on canvas
    // ========================================================================
    this.eventBus.on("shape:dropped", (data) => {
      this.log.info(
        "setupEventHandlers",
        `Shape dropped: ${data.type} at (${data.x}, ${data.y})`
      );

      // ✅ CORRECT: Use NodeManager.createNode() instead of Editor.renderNode()
      const nodeId = this.nodeManager.createNode(
        data.type, // Shape type (rect, circle, etc.)
        data.x, // X position
        data.y, // Y position
        {
          label: data.type.charAt(0).toUpperCase() + data.type.slice(1),
          style: {},
        }
      );

      this.log.info("setupEventHandlers", `✓ Node created: ${nodeId}`);
    });

    // ========================================================================
    // CANVAS CLICKED EVENT - Deselect all when canvas is clicked
    // ========================================================================
    this.eventBus.on("canvas:clicked", (point) => {
      this.log.info(
        "setupEventHandlers",
        `Canvas clicked at (${point.x}, ${point.y})`
      );

      // If we're in connecting mode, cancel connection
      if (this.connectingFrom) {
        this.log.info("setupEventHandlers", "Cancelling edge creation");
        this.connectingFrom = null;
        this.stateManager.setViewportMode("select");
      }

      // Hide all resize handles
      const allHandles =
        this.editor.nodeLayer.querySelectorAll(".handles-group");
      allHandles.forEach((group) => {
        group.style.display = "none";
      });

      // Clear selection in state manager
      this.stateManager.clearSelection();
    });

    // ========================================================================
    // NODE SELECTED EVENT - Update state and right panel
    // ========================================================================
    this.eventBus.on("node:selected", (data) => {
      this.log.info("setupEventHandlers", `Node selected: ${data.nodeId}`);

      // Hide all other handles first
      const allHandles =
        this.editor.nodeLayer.querySelectorAll(".handles-group");
      allHandles.forEach((group) => {
        group.style.display = "none";
      });

      // Show handles for selected node
      const selectedNode = this.editor.nodeLayer.querySelector(
        `[data-node-id="${data.nodeId}"]`
      );
      if (selectedNode) {
        const handlesGroup = selectedNode.querySelector(".handles-group");
        if (handlesGroup) {
          handlesGroup.style.display = "block";
          this.log.info(
            "setupEventHandlers",
            `✓ Resize handles shown for node ${data.nodeId}`
          );
        }
      }

      // Update state manager
      this.stateManager.selectNode(data.nodeId);

      // Update right inspector panel
      this.eventBus.emit("inspector:update", {
        type: "node",
        data: data.nodeData,
      });
    });

    // ========================================================================
    // PORT MOUSEDOWN EVENT - Start edge creation
    // ========================================================================
    this.eventBus.on("port:mousedown", (data) => {
      this.log.info(
        "setupEventHandlers",
        `Port clicked: ${data.portId} on node ${data.nodeId}`
      );

      // Start edge creation mode
      this.stateManager.setViewportMode("connecting");

      // Get the port element to find its position
      const portElement = this.editor.nodeLayer.querySelector(
        `.port[data-node-id="${data.nodeId}"][data-port-id="${data.portId}"]`
      );

      if (portElement) {
        const portRect = portElement.getBoundingClientRect();
        const svgRect = this.editor.svg.getBoundingClientRect();

        // Convert screen coordinates to SVG coordinates
        const startPoint = this.editor.screenToSVG(
          portRect.left + portRect.width / 2,
          portRect.top + portRect.height / 2
        );

        // Store source node and port information
        this.connectingFrom = {
          nodeId: data.nodeId,
          portId: data.portId,
          portPosition: data.portPosition,
          startX: startPoint.x,
          startY: startPoint.y,
          previewLine: null,
        };

        // Create preview line
        this.connectingFrom.previewLine = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        this.connectingFrom.previewLine.setAttribute("x1", startPoint.x);
        this.connectingFrom.previewLine.setAttribute("y1", startPoint.y);
        this.connectingFrom.previewLine.setAttribute("x2", startPoint.x);
        this.connectingFrom.previewLine.setAttribute("y2", startPoint.y);
        this.connectingFrom.previewLine.setAttribute("stroke", "#2196F3");
        this.connectingFrom.previewLine.setAttribute("stroke-width", "2");
        this.connectingFrom.previewLine.setAttribute("stroke-dasharray", "5,5");
        this.connectingFrom.previewLine.setAttribute("pointer-events", "none");
        this.connectingFrom.previewLine.setAttribute("class", "edge-preview");

        // Add to overlay layer
        this.editor.overlayLayer.appendChild(this.connectingFrom.previewLine);

        this.log.info(
          "setupEventHandlers",
          "Edge creation mode started - preview line created"
        );
      }
    });

    // ========================================================================
    // MOUSE MOVE - Update edge preview during drag
    // ========================================================================
    this.ui.editorContainer.addEventListener("mousemove", (e) => {
      if (this.connectingFrom && this.connectingFrom.previewLine) {
        const svgPoint = this.editor.screenToSVG(e.clientX, e.clientY);
        this.connectingFrom.previewLine.setAttribute("x2", svgPoint.x);
        this.connectingFrom.previewLine.setAttribute("y2", svgPoint.y);
      }
    });

    // ========================================================================
    // SECOND PORT CLICK - Complete edge creation
    // ========================================================================
    this.ui.editorContainer.addEventListener("mouseup", (e) => {
      // Only if we're in connecting mode
      if (!this.connectingFrom) return;
      if (
        this.stateManager.getViewportMode &&
        this.stateManager.getViewportMode() !== "connecting"
      )
        return;

      // Check if clicked on a port
      const portElement = e.target.closest(".port");

      if (!portElement) {
        // Clicked elsewhere - cancel connection
        this.log.info(
          "setupEventHandlers",
          "Cancelling edge creation - clicked outside port"
        );

        // Remove preview line
        if (this.connectingFrom && this.connectingFrom.previewLine) {
          this.editor.overlayLayer.removeChild(this.connectingFrom.previewLine);
        }

        this.connectingFrom = null;
        this.stateManager.setViewportMode("select");
        return;
      }

      // Get target port info
      const targetNodeId = portElement.getAttribute("data-node-id");
      const targetPortId = portElement.getAttribute("data-port-id");

      if (!targetNodeId || !targetPortId) {
        this.log.warn(
          "setupEventHandlers",
          "Invalid port element - missing data attributes"
        );
        return;
      }

      // Don't connect to same node
      if (targetNodeId === this.connectingFrom.nodeId) {
        this.log.info("setupEventHandlers", "Cannot connect node to itself");

        // Remove preview line
        if (this.connectingFrom.previewLine) {
          this.editor.overlayLayer.removeChild(this.connectingFrom.previewLine);
        }

        this.connectingFrom = null;
        this.stateManager.setViewportMode("select");
        return;
      }

      this.log.info(
        "setupEventHandlers",
        `Creating edge: ${this.connectingFrom.nodeId}[${this.connectingFrom.portId}] -> ${targetNodeId}[${targetPortId}]`
      );

      // Create the edge using EdgeManager
      if (this.edgeManager && this.edgeManager.createEdge) {
        const edgeId = this.edgeManager.createEdge(
          this.connectingFrom.nodeId,
          targetNodeId,
          this.connectingFrom.portId,
          targetPortId
        );

        if (edgeId) {
          this.log.info("setupEventHandlers", `✓ Edge created: ${edgeId}`);
        } else {
          this.log.error("setupEventHandlers", "Failed to create edge");
        }
      } else {
        this.log.error(
          "setupEventHandlers",
          "EdgeManager.createEdge not available"
        );
      }

      // Remove preview line
      if (this.connectingFrom && this.connectingFrom.previewLine) {
        this.editor.overlayLayer.removeChild(this.connectingFrom.previewLine);
      }

      // Reset connection state
      this.connectingFrom = null;
      this.stateManager.setViewportMode("select");
    });

    // ========================================================================
    // NODE MOVED EVENT - Update connected edges
    // ========================================================================
    this.eventBus.on("node:moved", (data) => {
      this.log.info(
        "setupEventHandlers",
        `Node moved: ${data.nodeId} to (${data.x}, ${data.y})`
      );

      // Update connected edges if EdgeManager exists
      if (this.edgeManager && this.edgeManager.updateNodeEdges) {
        this.edgeManager.updateNodeEdges(data.nodeId);
      }
    });

    // ========================================================================
    // NODE DRAGGING EVENT - Update connected edges in real-time
    // ========================================================================
    this.eventBus.on("node:dragging", (data) => {
      // Update connected edges during drag for smooth feedback
      if (this.edgeManager && this.edgeManager.updateNodeEdges) {
        this.edgeManager.updateNodeEdges(data.nodeId);
      }
    });

    // ========================================================================
    // NODE RESIZED EVENT - Update connected edges
    // ========================================================================
    this.eventBus.on("node:resized", (data) => {
      this.log.info("setupEventHandlers", `Node resized: ${data.nodeId}`);

      // Update connected edges
      if (this.edgeManager && this.edgeManager.updateNodeEdges) {
        this.edgeManager.updateNodeEdges(data.nodeId);
      }
    });

    // ========================================================================
    // NODE RESIZE START EVENT - Start resize operation
    // ========================================================================
    this.eventBus.on("node:resizestart", (data) => {
      this.log.info(
        "setupEventHandlers",
        `Resize started: ${data.nodeId}, handle: ${data.handleId}`
      );

      // Store resize state
      this.resizing = {
        nodeId: data.nodeId,
        handleId: data.handleId,
        startX: data.clientX,
        startY: data.clientY,
      };

      // Set mode to resizing
      this.stateManager.setViewportMode("resizing");
    });

    // ========================================================================
    // NODE RESIZING EVENT - Update edges during resize
    // ========================================================================
    this.eventBus.on("node:resizing", (data) => {
      // Update connected edges during resize for smooth feedback
      if (this.edgeManager && this.edgeManager.updateNodeEdges) {
        this.edgeManager.updateNodeEdges(data.nodeId);
      }
    });

    // ========================================================================
    // VIEWPORT CHANGED EVENT - Update status bar and minimap
    // ========================================================================
    this.eventBus.on("viewport:changed", (viewport) => {
      this.log.info(
        "setupEventHandlers",
        `Viewport changed: zoom=${viewport.zoom.toFixed(
          2
        )}, x=${viewport.x.toFixed(0)}, y=${viewport.y.toFixed(0)}`
      );

      // Update status bar
      this.eventBus.emit("statusbar:update", {
        zoom: viewport.zoom,
        position: { x: viewport.x, y: viewport.y },
      });

      // Update minimap
      this.eventBus.emit("minimap:update", viewport);
    });

    // ========================================================================
    // NODE EDIT EVENT - Enter text edit mode
    // ========================================================================
    this.eventBus.on("node:edit", (data) => {
      this.log.info("setupEventHandlers", `Node edit mode: ${data.nodeId}`);

      // Enter edit mode
      this.stateManager.setViewportMode("editing");

      // TODO: Show text editor for node label
      // For now, just use prompt
      const newLabel = prompt("Enter new label:", data.nodeData.label);
      if (newLabel && newLabel.trim()) {
        this.nodeManager.updateNode(data.nodeId, { label: newLabel.trim() });
        this.stateManager.setViewportMode("select");
      } else {
        this.stateManager.setViewportMode("select");
      }
    });

    // ========================================================================
    // NODE DELETED EVENT - Remove connected edges
    // ========================================================================
    this.eventBus.on("node:deleted", (data) => {
      this.log.info("setupEventHandlers", `Node deleted: ${data.nodeId}`);

      // Remove all edges connected to this node
      if (this.edgeManager && this.edgeManager.removeNodeEdges) {
        this.edgeManager.removeNodeEdges(data.nodeId);
      }
    });

    // ========================================================================
    // CONTEXT MENU EVENT - Show context menu
    // ========================================================================
    this.eventBus.on("canvas:contextmenu", (data) => {
      this.log.info(
        "setupEventHandlers",
        `Context menu at (${data.clientX}, ${data.clientY})`
      );

      // TODO: Show context menu
      // this.showContextMenu(data.clientX, data.clientY);
    });

    // ========================================================================
    // KEYBOARD SHORTCUTS
    // ========================================================================
    document.addEventListener("keydown", (e) => {
      // Delete key - delete selected nodes
      if (e.key === "Delete" || e.key === "Backspace") {
        const selectedNodes = this.stateManager.getSelectedNodes();
        if (selectedNodes && selectedNodes.length > 0) {
          e.preventDefault();
          selectedNodes.forEach((nodeId) => {
            this.nodeManager.removeNode(nodeId);
          });
          this.log.info(
            "setupEventHandlers",
            `Deleted ${selectedNodes.length} node(s)`
          );
        }
      }

      // Escape key - cancel current operation
      if (e.key === "Escape") {
        if (this.connectingFrom) {
          // Remove preview line
          if (this.connectingFrom.previewLine) {
            this.editor.overlayLayer.removeChild(
              this.connectingFrom.previewLine
            );
          }

          this.connectingFrom = null;
          this.stateManager.setViewportMode("select");
          this.log.info(
            "setupEventHandlers",
            "Cancelled edge creation via Escape"
          );
        }
      }

      // Ctrl+Z - Undo (if history manager exists)
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        // TODO: Implement undo
        this.log.info(
          "setupEventHandlers",
          "Undo requested (not yet implemented)"
        );
      }

      // Ctrl+Y - Redo (if history manager exists)
      if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        // TODO: Implement redo
        this.log.info(
          "setupEventHandlers",
          "Redo requested (not yet implemented)"
        );
      }
    });

    this.log.info("setupEventHandlers", "✓ All event handlers registered");
    this.log.exit("setupEventHandlers");
  }

  /**
   * Get a service from the container
   */
  getService(serviceName) {
    return this.container.get(serviceName);
  }

  /**
   * Get the node manager
   */
  getNodeManager() {
    return this.nodeManager;
  }

  /**
   * Get the edge manager
   */
  getEdgeManager() {
    return this.edgeManager;
  }

  /**
   * Get the editor
   */
  getEditor() {
    return this.editor;
  }

  /**
   * Get the state manager
   */
  getStateManager() {
    return this.stateManager;
  }

  /**
   * Destroy the application
   */
  destroy() {
    this.log.enter("destroy");

    // Clear connection state
    this.connectingFrom = null;
    this.resizing = null;

    // Destroy managers
    if (this.nodeManager) {
      this.nodeManager.clearAll();
    }

    if (this.editor) {
      this.editor.destroy();
    }

    // Clear all event listeners
    if (this.eventBus) {
      this.eventBus.clear();
    }

    this.log.info("destroy", "✓ Application destroyed");
    this.log.exit("destroy");
  }
}

// Auto-initialize when DOM is ready
if (typeof window !== "undefined") {
  const startApp = async () => {
    const loader = document.getElementById("loading-overlay");
    let app = null;

    try {
      if (loader) {
        loader.style.display = "flex";
      }

      app = new FlowchartApp({ debug: false }); // Set to false in production
      await app.initialize();

      // Expose app to window for debugging
      window.flowchartApp = app;

      console.log(
        "%c✓ Flowchart Editor Ready!",
        "color: #4CAF50; font-size: 16px; font-weight: bold;"
      );
      console.log("Access the app via: window.flowchartApp");
      console.log("Available methods:");
      console.log("  - window.flowchartApp.getNodeManager()");
      console.log("  - window.flowchartApp.getEdgeManager()");
      console.log("  - window.flowchartApp.getEditor()");
      console.log("  - window.flowchartApp.editor.fitToView()");
    } catch (error) {
      console.error(
        "%c✗ Initialization Failed",
        "color: #F44336; font-size: 16px; font-weight: bold;"
      );
      if (app && app.log) {
        app.log.error("Error initializing FlowchartApp:", error);
      } else {
        console.error("Error initializing FlowchartApp:", error);
      }
      console.error(error.stack);
    } finally {
      if (loader) {
        loader.classList.add("hide");
        setTimeout(() => {
          loader.style.display = "none";
        }, 500);
      }
    }
  };

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", startApp);
  } else {
    startApp();
  }
}

export default FlowchartApp;
