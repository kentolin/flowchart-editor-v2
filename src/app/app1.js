import { DebugLogger, DebugControl } from "../utils/debug/DebugLogger.js";
import { DOMUtils } from "../utils/dom/dom.js";
import { ServiceContainer, ServiceProvider } from "../core/container/index.js";
import { ShapeLoader } from "../shapes/loader/index.js";
import { ToolBar } from "../ui/bars/ToolBar.js";
import { MenuBar } from "../ui/bars/MenuBar.js";
import { StatusBar } from "../ui/bars/StatusBar.js";
import { LeftPalette } from "../ui/panels/LeftPalette.js";
import { RightInspector, LayersPanel, MiniMap } from "../ui/panels/Panels.js";

class FlowchartApp {
  constructor(options = {}) {
    this.options = {
      theme: "light",
      debug: false,
      ...options,
    };

    if (this.options.debug) {
      DebugControl.enableGlobal();
    } else {
      DebugControl.disableGlobal();
    }
    this.log = DebugLogger.for(this);

    this.log.enter("constructor");

    this.container = new ServiceContainer();
    this.log.exit("constructor");
  }

  async initialize() {
    this.log.enter("Initialization started");

    // Step 1: Create DOM Structure for the App
    this.log.stage("Creating DOM structure");
    this.createDOMStructure();

    // Step 2: Register Services
    this.log.stage("Registering services");
    ServiceProvider.register(this.container);

    // Step 3: Retrieve Core Services
    this.log.stage("Getting core services");
    this.eventBus = this.container.get("eventBus");
    this.shapeRegistry = this.container.get("shapeRegistry");
    this.stateManager = this.container.get("stateManager");

    // Step 4: Load Built-in Shapes
    this.log.stage("Loading built-in shapes");
    const shapeLoader = new ShapeLoader(this.shapeRegistry);
    await shapeLoader.loadBuiltInShapes();

    // Step 5: Setup UI
    this.log.stage("Setting up UI");
    this.setupUI();

    // Step 6: Get Editor, NodeManager, EdgeManager and Initialize Editor
    this.log.stage("Initializing Editor and Managers");
    this.setupEditor();

    // Step 7: Setup event handlers
    this.log.stage("Setting up event handlers");
    this.setupEventHandlers();

    this.log.exit("Initialization completed");
  }

  createDOMStructure() {
    this.log.enter("createDOMStructure");

    const appContainer = document.getElementById("app");
    if (!appContainer) {
      this.log.error("App container not found");
      return;
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

    this.log.exit("setupUI");
  }

  /**
   * Step 6: Initialize Editor and get Managers
   */
  setupEditor() {
    this.log.enter("setupEditor");

    // Get Editor instance from container
    this.log.info("setupEditor", "Getting Editor from container...");
    this.editor = this.container.get("editor");

    // Set the container reference on the editor
    this.editor.container = this.ui.editorContainer;

    // Initialize the editor with the DOM element
    this.log.info("setupEditor", "Initializing Editor...");
    this.editor.initialize();

    // Get Managers from container
    this.log.info("setupEditor", "Getting NodeManager from container...");
    this.nodeManager = this.container.get("nodeManager");

    this.log.info("setupEditor", "Getting EdgeManager from container...");
    this.edgeManager = this.container.get("edgeManager");

    // Get Controllers from container (optional, but good to have references)
    this.log.info("setupEditor", "Getting NodeController from container...");
    this.nodeController = this.container.get("nodeController");

    this.log.info("setupEditor", "Getting EdgeController from container...");
    this.edgeController = this.container.get("edgeController");

    this.log.info(
      "setupEditor",
      "✓ Editor and Managers initialized successfully"
    );
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

      // Create node using NodeManager
      const nodeData = {
        type: data.type,
        x: data.x,
        y: data.y,
        width: 120,
        height: 60,
        label: data.type.charAt(0).toUpperCase() + data.type.slice(1),
        style: {},
      };

      // Render the node on the editor
      const nodeId = `node_${Date.now()}`;
      const shapeDefinition = this.shapeRegistry.getDefinition(data.type);
      this.editor.renderNode(nodeId, nodeData, shapeDefinition);

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

      // Store source node and port information
      this.connectingFrom = {
        nodeId: data.nodeId,
        portId: data.portId,
        portPosition: data.portPosition,
      };

      this.log.info("setupEventHandlers", "Edge creation mode started");
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
   * Destroy the application
   */
  destroy() {
    this.log.enter("destroy");

    if (this.editor) {
      this.editor.destroy();
    }

    // Clear all event listeners
    this.eventBus.clear();

    this.log.info("destroy", "✓ Application destroyed");
    this.log.exit("destroy");
  }
}

if (typeof window !== "undefined") {
  const startApp = async () => {
    const loader = document.getElementById("loading-overlay");
    let app = null;

    try {
      if (loader) {
        loader.style.display = "flex";
      }

      app = new FlowchartApp({ debug: false });
      await app.initialize();

      window.flowchartApp = app;

      console.log(
        "%c✓ Flowchart Editor Ready!",
        "color: #4CAF50; font-size: 16px; font-weight: bold;"
      );
      console.log("Access the app via: window.flowchartApp");
      console.log("Try: window.flowchartApp.editor.fitToView()");
    } catch (error) {
      console.error(
        "%c✗ Initialization Failed",
        "color: #F44336; font-size: 16px; font-weight: bold;"
      );
      if (app && app.log)
        app.log.error("Error initializing FlowchartApp:", error);
      else console.error("Error initializing FlowchartApp:", error);
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
