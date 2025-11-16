import { DebugLogger, DebugControl } from "../utils/debug/DebugLogger.js";
import { DOMUtils } from "../utils/dom/dom.js";
import { ServiceContainer, ServiceProvider } from "../core/container/index.js";

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

    this.container = null;
    this.services = null;
    this.eventBus = null;
    this.stateManager = null;
    this.editor = null;
    this.managers = {};
    this.ui = {};

    this.log.exit("constructor");
  }

  async initialize() {
    this.log.enter("initialize");

    this.log.stage("Setting up service container");
    this.container = new ServiceContainer();

    this.log.stage("Registering services");
    ServiceProvider.register(this.container);

    this.log.stage("Creating DOM structure");
    this.createDOMStructure();

    this.log.exit("initialize");
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

    // <! -- Editor Canvas -->
    const editorContainer = DOMUtils.createElement("div", {
      classes: "editor-container",
      attributes: { id: "editor-container" },
    });
    const editorSVG = DOMUtils.createSVGElement("svg", {
      id: "editor-svg",
      class: "editor-svg",
    });
    editorContainer.appendChild(editorSVG);
    editorArea.appendChild(editorContainer);

    // <! -- Mini Map -->
    const miniMap = DOMUtils.createElement("div", {
      classes: "mini-map",
      attributes: { id: "mini-map" },
    });
    editorArea.appendChild(miniMap);

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
      editorSVG,
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
}

if (typeof window !== "undefined") {
  const startApp = async () => {
    const loader = document.getElementById("loading-overlay");
    let app = null;

    try {
      if (loader) {
        loader.style.display = "flex";
      }

      app = new FlowchartApp({ debug: true });
      await app.initialize();

      window.flowchartApp = app;
    } catch (error) {
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
