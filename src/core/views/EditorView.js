/**
 * EditorView.js - Main Editor Orchestrator & Canvas Manager
 *
 * Central editor instance that coordinates all components, manages
 * the canvas, handles rendering, and orchestrates the editing experience.
 *
 * DEPENDENCIES: ServiceContainer (receives full container for service access)
 *
 * @module src/views/EditorView
 * @version 1.0.0
 *
 * Purpose:
 * - Main SVG canvas management
 * - Coordinate all editor systems (state, rendering, interaction)
 * - Canvas lifecycle (create, resize, cleanup)
 * - Rendering orchestration
 * - Event delegation
 * - Performance optimization
 *
 * Responsibilities:
 * - Initialize SVG canvas and container
 * - Manage render loop and batching
 * - Handle viewport transformations
 * - Delegate events to handlers
 * - Provide rendering APIs (layers, groups)
 * - Clean up on destruction
 *
 * Architecture:
 * The Editor uses a layered SVG structure:
 * - gridLayer: Grid and guides
 * - contentLayer: Nodes and edges
 * - selectionLayer: Selection highlights
 * - interactionLayer: Temporary interaction feedback
 * - overlayLayer: Tooltips, labels, etc.
 *
 * @example
 * const container = new ServiceContainer();
 * ServiceProvider.register(container);
 * const editor = container.get('editor');
 *
 * // Initialize on DOM element
 * editor.mount(document.getElementById('canvas'));
 *
 * // Now editor is ready to render
 * editor.render();
 *
 * // Listen to editor events
 * editor.on('canvas:click', (event) => {
 *   console.log('Canvas clicked at', event.x, event.y);
 * });
 */

/**
 * EditorView Class
 *
 * Main editor instance providing canvas management and orchestration.
 */
class EditorView {
  /**
   * Initialize the editor
   *
   * @param {ServiceContainer} container - Service container for accessing managers
   *
   * @throws {Error} If container is not valid
   *
   * @example
   * const editor = new EditorView(container);
   */
  constructor(container) {
    // Validate container
    if (!container || typeof container.get !== "function") {
      throw new Error(
        "EditorView: Constructor requires valid ServiceContainer instance"
      );
    }

    // Store reference to container
    this.container = container;

    // DOM elements
    this.domElement = null; // Container element
    this.svg = null; // SVG root element
    this.canvas = null; // Main canvas group

    // SVG layers (in order from back to front)
    this.layers = {
      grid: null, // Grid and guides
      content: null, // Nodes and edges
      selection: null, // Selection overlays
      interaction: null, // Temporary feedback
      overlay: null, // Tooltips, labels, etc.
    };

    // Transform state
    this.transform = {
      scale: 1,
      translateX: 0,
      translateY: 0,
    };

    // Rendering state
    this.isRendering = false;
    this.renderScheduled = false;
    this.renderFrame = null;
    this.renderBatch = [];

    // Event listeners
    this.eventListeners = new Map();

    // Configuration
    this.config = {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
      gridSize: 20,
      showGrid: true,
      showGuides: true,
      pixelRatio: window.devicePixelRatio || 1,
    };

    // Cached services
    this.cachedServices = {
      editorState: null,
      stateManager: null,
      eventBus: null,
      nodeManager: null,
      edgeManager: null,
    };

    // Initialize state
    this.isInitialized = false;
    this.isMounted = false;
    this.isDestroyed = false;
  }

  /**
   * Get a cached service or fetch from container
   *
   * @private
   *
   * @param {string} serviceName - Service to get
   *
   * @returns {*} Service instance
   */
  _getService(serviceName) {
    if (!this.cachedServices.hasOwnProperty(serviceName)) {
      throw new Error(
        `EditorView: Unknown service '${serviceName}'. Available: ${Object.keys(
          this.cachedServices
        ).join(", ")}`
      );
    }

    if (this.cachedServices[serviceName] === null) {
      this.cachedServices[serviceName] = this.container.get(serviceName);
    }

    return this.cachedServices[serviceName];
  }

  /**
   * Get EditorState instance
   *
   * @returns {EditorState} Editor state
   */
  getState() {
    return this._getService("editorState");
  }

  /**
   * Get StateManager instance
   *
   * @returns {StateManager} State manager
   */
  getStateManager() {
    return this._getService("stateManager");
  }

  /**
   * Get EventBus instance
   *
   * @returns {EventBus} Event bus
   */
  getEventBus() {
    return this._getService("eventBus");
  }

  /**
   * Get NodeManager instance
   *
   * @returns {NodeManager} Node manager
   */
  getNodeManager() {
    return this._getService("nodeManager");
  }

  /**
   * Get EdgeManager instance
   *
   * @returns {EdgeManager} Edge manager
   */
  getEdgeManager() {
    return this._getService("edgeManager");
  }

  /**
   * Mount editor to DOM element
   *
   * Creates SVG canvas and initializes rendering.
   *
   * @param {HTMLElement} domElement - Container element
   * @param {Object} [options] - Configuration options
   * @param {number} [options.width] - Canvas width
   * @param {number} [options.height] - Canvas height
   * @param {string} [options.backgroundColor] - Background color
   *
   * @throws {Error} If domElement is invalid
   *
   * @example
   * const container = document.getElementById('editor');
   * editor.mount(container, {
   *   width: 1920,
   *   height: 1080,
   *   backgroundColor: '#f5f5f5'
   * });
   */
  mount(domElement, options = {}) {
    // Validate DOM element
    if (!domElement || !(domElement instanceof HTMLElement)) {
      throw new Error("EditorView.mount: Requires valid HTMLElement");
    }

    this.domElement = domElement;

    // Update config
    if (options.width) this.config.width = options.width;
    if (options.height) this.config.height = options.height;
    if (options.backgroundColor)
      this.config.backgroundColor = options.backgroundColor;

    // Create SVG element
    this._createSVG();

    // Create layers
    this._createLayers();

    // Set up event listeners
    this._setupEventListeners();

    // Update state with canvas dimensions
    this.getStateManager().setCanvasSize(
      this.config.width,
      this.config.height,
      { reason: "editor mounted" }
    );

    // Mark as mounted
    this.isMounted = true;
    this.isInitialized = true;

    // Emit event
    this.emit("editor:mounted", {
      width: this.config.width,
      height: this.config.height,
    });
  }

  /**
   * Create SVG element
   *
   * @private
   */
  _createSVG() {
    // Create SVG namespace
    const SVG_NS = "http://www.w3.org/2000/svg";

    // Create main SVG element
    this.svg = document.createElementNS(SVG_NS, "svg");
    this.svg.setAttribute("width", this.config.width);
    this.svg.setAttribute("height", this.config.height);
    this.svg.setAttribute(
      "viewBox",
      `0 0 ${this.config.width} ${this.config.height}`
    );
    this.svg.style.backgroundColor = this.config.backgroundColor;
    this.svg.style.border = "1px solid #ddd";
    this.svg.style.display = "block";
    this.svg.classList.add("editor-canvas");

    // Create main canvas group
    this.canvas = document.createElementNS(SVG_NS, "g");
    this.canvas.classList.add("editor-canvas-group");
    this.svg.appendChild(this.canvas);

    // Append SVG to DOM
    this.domElement.appendChild(this.svg);
  }

  /**
   * Create SVG layers
   *
   * @private
   */
  _createLayers() {
    const SVG_NS = "http://www.w3.org/2000/svg";

    // Grid layer (background)
    this.layers.grid = document.createElementNS(SVG_NS, "g");
    this.layers.grid.classList.add("grid-layer");
    this.canvas.appendChild(this.layers.grid);

    // Content layer (nodes and edges)
    this.layers.content = document.createElementNS(SVG_NS, "g");
    this.layers.content.classList.add("content-layer");
    this.canvas.appendChild(this.layers.content);

    // Selection layer (highlights)
    this.layers.selection = document.createElementNS(SVG_NS, "g");
    this.layers.selection.classList.add("selection-layer");
    this.canvas.appendChild(this.layers.selection);

    // Interaction layer (temporary feedback)
    this.layers.interaction = document.createElementNS(SVG_NS, "g");
    this.layers.interaction.classList.add("interaction-layer");
    this.canvas.appendChild(this.layers.interaction);

    // Overlay layer (tooltips, labels)
    this.layers.overlay = document.createElementNS(SVG_NS, "g");
    this.layers.overlay.classList.add("overlay-layer");
    this.canvas.appendChild(this.layers.overlay);
  }

  /**
   * Set up DOM event listeners
   *
   * @private
   */
  _setupEventListeners() {
    if (!this.svg) return;

    // Mouse events
    this.svg.addEventListener("mousedown", (e) => this._onMouseDown(e));
    this.svg.addEventListener("mousemove", (e) => this._onMouseMove(e));
    this.svg.addEventListener("mouseup", (e) => this._onMouseUp(e));
    this.svg.addEventListener("mouseleave", (e) => this._onMouseLeave(e));

    // Touch events
    this.svg.addEventListener("touchstart", (e) => this._onTouchStart(e));
    this.svg.addEventListener("touchmove", (e) => this._onTouchMove(e));
    this.svg.addEventListener("touchend", (e) => this._onTouchEnd(e));

    // Wheel events
    this.svg.addEventListener("wheel", (e) => this._onWheel(e), {
      passive: false,
    });

    // Context menu
    this.svg.addEventListener("contextmenu", (e) => this._onContextMenu(e));

    // Keyboard events (delegate to document)
    document.addEventListener("keydown", (e) => this._onKeyDown(e));
    document.addEventListener("keyup", (e) => this._onKeyUp(e));

    // Window resize
    window.addEventListener("resize", () => this._onWindowResize());
  }

  /**
   * Handle mouse down event
   *
   * @private
   */
  _onMouseDown(e) {
    const coords = this._getEventCoordinates(e);
    const stateManager = this.getStateManager();

    // Check if it's a space bar pan or regular click
    if (e.button === 0) {
      // Left click
      this.emit("canvas:mousedown", {
        button: 0,
        x: coords.x,
        y: coords.y,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        event: e,
      });
    } else if (e.button === 2) {
      // Right click
      e.preventDefault();
      this.emit("canvas:contextmenu", {
        x: coords.x,
        y: coords.y,
        event: e,
      });
    }
  }

  /**
   * Handle mouse move event
   *
   * @private
   */
  _onMouseMove(e) {
    const coords = this._getEventCoordinates(e);

    this.emit("canvas:mousemove", {
      x: coords.x,
      y: coords.y,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      event: e,
    });
  }

  /**
   * Handle mouse up event
   *
   * @private
   */
  _onMouseUp(e) {
    const coords = this._getEventCoordinates(e);

    this.emit("canvas:mouseup", {
      x: coords.x,
      y: coords.y,
      event: e,
    });
  }

  /**
   * Handle mouse leave event
   *
   * @private
   */
  _onMouseLeave(e) {
    this.emit("canvas:mouseleave", { event: e });
  }

  /**
   * Handle touch start event
   *
   * @private
   */
  _onTouchStart(e) {
    const coords = this._getEventCoordinates(e.touches[0]);

    this.emit("canvas:touchstart", {
      x: coords.x,
      y: coords.y,
      touchCount: e.touches.length,
      event: e,
    });
  }

  /**
   * Handle touch move event
   *
   * @private
   */
  _onTouchMove(e) {
    const coords = this._getEventCoordinates(e.touches[0]);

    this.emit("canvas:touchmove", {
      x: coords.x,
      y: coords.y,
      touchCount: e.touches.length,
      event: e,
    });
  }

  /**
   * Handle touch end event
   *
   * @private
   */
  _onTouchEnd(e) {
    this.emit("canvas:touchend", {
      touchCount: e.touches.length,
      event: e,
    });
  }

  /**
   * Handle wheel event (zoom)
   *
   * @private
   */
  _onWheel(e) {
    e.preventDefault();

    const stateManager = this.getStateManager();

    if (e.deltaY > 0) {
      stateManager.zoomOut({ reason: "mouse wheel" });
    } else {
      stateManager.zoomIn({ reason: "mouse wheel" });
    }

    this.emit("canvas:wheel", {
      deltaY: e.deltaY,
      deltaX: e.deltaX,
      event: e,
    });
  }

  /**
   * Handle context menu event
   *
   * @private
   */
  _onContextMenu(e) {
    e.preventDefault();

    const coords = this._getEventCoordinates(e);

    this.emit("canvas:contextmenu", {
      x: coords.x,
      y: coords.y,
      event: e,
    });
  }

  /**
   * Handle keyboard down event
   *
   * @private
   */
  _onKeyDown(e) {
    // Only emit if editor has focus (has a mounted DOM element)
    if (!this.isMounted) return;

    this.emit("canvas:keydown", {
      key: e.key,
      code: e.code,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      event: e,
    });
  }

  /**
   * Handle keyboard up event
   *
   * @private
   */
  _onKeyUp(e) {
    if (!this.isMounted) return;

    this.emit("canvas:keyup", {
      key: e.key,
      code: e.code,
      event: e,
    });
  }

  /**
   * Handle window resize
   *
   * @private
   */
  _onWindowResize() {
    // Only resize if editor is mounted in a container
    if (!this.domElement || !this.isMounted) return;

    const rect = this.domElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      this.resize(rect.width, rect.height);
    }
  }

  /**
   * Get event coordinates in canvas space
   *
   * Converts viewport coordinates to canvas coordinates accounting
   * for zoom and pan transformations.
   *
   * @private
   *
   * @param {MouseEvent|Touch} e - DOM event or touch object
   *
   * @returns {Object} Coordinates in canvas space { x, y }
   */
  _getEventCoordinates(e) {
    if (!this.svg) {
      return { x: 0, y: 0 };
    }

    // Get SVG position in viewport
    const rect = this.svg.getBoundingClientRect();

    // Get mouse position in viewport
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    // Transform to canvas coordinates (account for zoom and pan)
    const stateManager = this.getStateManager();
    const zoom = stateManager.getZoom();
    const pan = stateManager.getPan();

    const canvasX = (viewportX - pan.x) / zoom;
    const canvasY = (viewportY - pan.y) / zoom;

    return { x: canvasX, y: canvasY };
  }

  /**
   * Update canvas transform
   *
   * @private
   */
  _updateTransform() {
    if (!this.canvas) return;

    const stateManager = this.getStateManager();
    const zoom = stateManager.getZoom();
    const pan = stateManager.getPan();

    const transform = `translate(${pan.x}, ${pan.y}) scale(${zoom})`;
    this.canvas.setAttribute("transform", transform);
  }

  /**
   * Render the canvas
   *
   * Called when state changes. Batches render operations for performance.
   *
   * @example
   * editor.render();
   */
  render() {
    if (this.renderScheduled) {
      return;
    }

    this.renderScheduled = true;

    // Use requestAnimationFrame for smooth rendering
    this.renderFrame = requestAnimationFrame(() => {
      this._performRender();
      this.renderScheduled = false;
    });
  }

  /**
   * Perform actual rendering
   *
   * @private
   */
  _performRender() {
    if (!this.isMounted || this.isDestroyed) {
      return;
    }

    this.isRendering = true;

    try {
      // Update transform based on current zoom/pan
      this._updateTransform();

      // Render grid if enabled
      if (this.config.showGrid) {
        this._renderGrid();
      }

      // Let managers render their content
      const nodeManager = this.getNodeManager();
      const edgeManager = this.getEdgeManager();

      if (nodeManager && typeof nodeManager.render === "function") {
        nodeManager.render(this);
      }

      if (edgeManager && typeof edgeManager.render === "function") {
        edgeManager.render(this);
      }

      // Render selection
      this._renderSelection();

      // Emit render event
      this.emit("editor:rendered", { timestamp: Date.now() });
    } catch (error) {
      console.error("Editor render error:", error);
    } finally {
      this.isRendering = false;
    }
  }

  /**
   * Render grid
   *
   * @private
   */
  _renderGrid() {
    if (!this.layers.grid) return;

    // Clear existing grid
    while (this.layers.grid.firstChild) {
      this.layers.grid.removeChild(this.layers.grid.firstChild);
    }

    const SVG_NS = "http://www.w3.org/2000/svg";
    const gridSize = this.config.gridSize;
    const width = this.config.width;
    const height = this.config.height;

    // Create group for grid lines
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("stroke", "#e0e0e0");
    group.setAttribute("stroke-width", "0.5");

    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", x);
      line.setAttribute("y1", 0);
      line.setAttribute("x2", x);
      line.setAttribute("y2", height);
      group.appendChild(line);
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", 0);
      line.setAttribute("y1", y);
      line.setAttribute("x2", width);
      line.setAttribute("y2", y);
      group.appendChild(line);
    }

    this.layers.grid.appendChild(group);
  }

  /**
   * Render selection highlights
   *
   * @private
   */
  _renderSelection() {
    if (!this.layers.selection) return;

    // Clear existing selection
    while (this.layers.selection.firstChild) {
      this.layers.selection.removeChild(this.layers.selection.firstChild);
    }

    const stateManager = this.getStateManager();
    const selectedNodeIds = stateManager.getSelectedNodeIds();

    // Draw selection boxes
    for (const nodeId of selectedNodeIds) {
      const node = stateManager.getNode(nodeId);
      if (!node) continue;

      this._drawSelectionBox(node);
    }
  }

  /**
   * Draw selection box around entity
   *
   * @private
   */
  _drawSelectionBox(entity) {
    const SVG_NS = "http://www.w3.org/2000/svg";

    // Create selection box (rectangle with dashed border)
    const padding = 4;
    const x = (entity.x || 0) - padding;
    const y = (entity.y || 0) - padding;
    const width = (entity.width || 100) + padding * 2;
    const height = (entity.height || 100) + padding * 2;

    const box = document.createElementNS(SVG_NS, "rect");
    box.setAttribute("x", x);
    box.setAttribute("y", y);
    box.setAttribute("width", width);
    box.setAttribute("height", height);
    box.setAttribute("fill", "none");
    box.setAttribute("stroke", "#0066cc");
    box.setAttribute("stroke-width", "2");
    box.setAttribute("stroke-dasharray", "5,5");
    box.classList.add("selection-box");

    this.layers.selection.appendChild(box);
  }

  /**
   * Get a layer for rendering
   *
   * Allows managers to add content to specific layers.
   *
   * @param {string} layerName - Layer name (grid, content, selection, etc.)
   *
   * @returns {SVGGElement} Layer element
   *
   * @throws {Error} If layer doesn't exist
   *
   * @example
   * const layer = editor.getLayer('content');
   * layer.appendChild(nodeElement);
   */
  getLayer(layerName) {
    if (!this.layers.hasOwnProperty(layerName)) {
      throw new Error(
        `EditorView.getLayer: Unknown layer '${layerName}'. Available: ${Object.keys(
          this.layers
        ).join(", ")}`
      );
    }

    return this.layers[layerName];
  }

  /**
   * Clear a layer
   *
   * @param {string} layerName - Layer to clear
   *
   * @example
   * editor.clearLayer('content');
   */
  clearLayer(layerName) {
    const layer = this.getLayer(layerName);
    while (layer.firstChild) {
      layer.removeChild(layer.firstChild);
    }
  }

  /**
   * Resize canvas
   *
   * @param {number} width - New width
   * @param {number} height - New height
   * @param {Object} [options] - Optional metadata
   *
   * @example
   * editor.resize(1920, 1080);
   */
  resize(width, height, options = {}) {
    if (typeof width !== "number" || typeof height !== "number") {
      throw new Error(
        `EditorView.resize: Dimensions must be numbers, got (${typeof width}, ${typeof height})`
      );
    }

    this.config.width = width;
    this.config.height = height;

    if (this.svg) {
      this.svg.setAttribute("width", width);
      this.svg.setAttribute("height", height);
      this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }

    // Update state
    this.getStateManager().setCanvasSize(width, height, {
      reason: options.reason || "canvas resized",
    });

    // Trigger render
    this.render();

    this.emit("editor:resized", { width, height });
  }

  /**
   * Register event listener
   *
   * @param {string} eventName - Event name
   * @param {Function} handler - Event handler
   *
   * @example
   * editor.on('canvas:click', (e) => console.log('Clicked!'));
   */
  on(eventName, handler) {
    if (typeof eventName !== "string" || typeof handler !== "function") {
      throw new Error(
        "EditorView.on: Requires event name and handler function"
      );
    }

    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }

    this.eventListeners.get(eventName).push(handler);
  }

  /**
   * Unregister event listener
   *
   * @param {string} eventName - Event name
   * @param {Function} handler - Event handler
   *
   * @example
   * editor.off('canvas:click', handler);
   */
  off(eventName, handler) {
    if (!this.eventListeners.has(eventName)) {
      return;
    }

    const handlers = this.eventListeners.get(eventName);
    const index = handlers.indexOf(handler);

    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Emit event
   *
   * @private
   *
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   */
  emit(eventName, data = {}) {
    if (!this.eventListeners.has(eventName)) {
      return;
    }

    const handlers = this.eventListeners.get(eventName);
    for (const handler of handlers) {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for '${eventName}':`, error);
      }
    }
  }

  /**
   * Get debug info
   *
   * @returns {Object} Debug information
   *
   * @example
   * console.log(editor.debugInfo());
   */
  debugInfo() {
    return {
      isMounted: this.isMounted,
      isInitialized: this.isInitialized,
      isRendering: this.isRendering,
      isDestroyed: this.isDestroyed,
      canvasSize: this.getStateManager().getCanvasSize(),
      zoom: this.getStateManager().getZoom(),
      pan: this.getStateManager().getPan(),
      layersCount: Object.keys(this.layers).length,
      eventListenersCount: this.eventListeners.size,
    };
  }

  /**
   * Print debug info
   *
   * @example
   * editor.printDebugInfo();
   */
  printDebugInfo() {
    const info = this.debugInfo();
    console.log("========== Editor Debug Info ==========");
    console.log(`Mounted: ${info.isMounted}`);
    console.log(`Initialized: ${info.isInitialized}`);
    console.log(`Rendering: ${info.isRendering}`);
    console.log(`Destroyed: ${info.isDestroyed}`);
    console.log(`Canvas: ${info.canvasSize.width}x${info.canvasSize.height}`);
    console.log(`Zoom: ${(info.zoom * 100).toFixed(0)}%`);
    console.log(`Pan: (${info.pan.x.toFixed(0)}, ${info.pan.y.toFixed(0)})`);
    console.log(`Layers: ${info.layersCount}`);
    console.log(`Event Listeners: ${info.eventListenersCount}`);
    console.log("=".repeat(39));
  }

  /**
   * Destroy editor and cleanup
   *
   * Removes DOM elements and event listeners.
   *
   * @example
   * editor.destroy();
   */
  destroy() {
    if (this.isDestroyed) {
      return;
    }

    // Cancel any pending render frames
    if (this.renderFrame) {
      cancelAnimationFrame(this.renderFrame);
    }

    // Remove DOM element
    if (this.svg && this.svg.parentElement) {
      this.svg.parentElement.removeChild(this.svg);
    }

    // Clear references
    this.domElement = null;
    this.svg = null;
    this.canvas = null;
    this.layers = {};
    this.eventListeners.clear();

    // Mark as destroyed
    this.isDestroyed = true;
    this.isMounted = false;

    this.emit("editor:destroyed", {});
  }
}

export { EditorView };
