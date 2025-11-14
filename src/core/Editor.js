/**
 * Editor.js - Main editor class for canvas/viewport management
 *
 * Responsibilities:
 * - Canvas initialization and lifecycle
 * - Viewport management (pan, zoom)
 * - Tool selection and mode switching
 * - Coordinate transformations
 * - Event delegation to appropriate handlers
 * - Rendering orchestration
 */

export class Editor {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      width: options.width || 1920,
      height: options.height || 1080,
      minZoom: options.minZoom || 0.1,
      maxZoom: options.maxZoom || 5,
      zoomSpeed: options.zoomSpeed || 0.001,
      gridEnabled: options.gridEnabled !== false,
      gridSize: options.gridSize || 20,
      ...options,
    };

    // Canvas state
    this.canvas = null;
    this.svgElement = null;
    this.viewport = {
      x: 0,
      y: 0,
      zoom: 1,
    };

    // Editor state
    this.mode = "select"; // 'select', 'pan', 'draw', 'text', etc.
    this.tool = null;
    this.isDragging = false;
    this.isPanning = false;

    // Layers
    this.layers = {
      grid: null,
      content: null,
      overlay: null,
      ui: null,
    };

    // Event handlers storage
    this.handlers = new Map();

    this._initialize();
  }

  /**
   * Initialize editor
   * @private
   */
  _initialize() {
    this._createCanvas();
    this._createLayers();
    this._setupEventListeners();
    this._render();
  }

  /**
   * Create main canvas/SVG element
   * @private
   */
  _createCanvas() {
    // Create SVG element
    this.svgElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    this.svgElement.setAttribute("width", "100%");
    this.svgElement.setAttribute("height", "100%");
    this.svgElement.setAttribute("class", "flowchart-editor-canvas");
    this.svgElement.style.cssText = "display: block; background: white;";

    // Create defs for markers, patterns, etc.
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    this.svgElement.appendChild(defs);

    // Append to container
    this.container.appendChild(this.svgElement);

    this.canvas = this.svgElement;
  }

  /**
   * Create SVG layers
   * @private
   */
  _createLayers() {
    // Grid layer (bottom)
    this.layers.grid = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.layers.grid.setAttribute("class", "layer-grid");
    this.svgElement.appendChild(this.layers.grid);

    // Content layer (nodes and edges)
    this.layers.content = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.layers.content.setAttribute("class", "layer-content");
    this.svgElement.appendChild(this.layers.content);

    // Overlay layer (selection boxes, guides)
    this.layers.overlay = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.layers.overlay.setAttribute("class", "layer-overlay");
    this.svgElement.appendChild(this.layers.overlay);

    // UI layer (top - controls, handles)
    this.layers.ui = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.layers.ui.setAttribute("class", "layer-ui");
    this.svgElement.appendChild(this.layers.ui);

    // Apply viewport transform to content and overlay layers
    this._updateLayerTransforms();
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    // Mouse events
    this.on("mousedown", this._handleMouseDown.bind(this));
    this.on("mousemove", this._handleMouseMove.bind(this));
    this.on("mouseup", this._handleMouseUp.bind(this));
    this.on("wheel", this._handleWheel.bind(this), { passive: false });

    // Touch events for mobile
    this.on("touchstart", this._handleTouchStart.bind(this));
    this.on("touchmove", this._handleTouchMove.bind(this));
    this.on("touchend", this._handleTouchEnd.bind(this));

    // Context menu
    this.on("contextmenu", this._handleContextMenu.bind(this));

    // Keyboard events (attached to window)
    window.addEventListener("keydown", this._handleKeyDown.bind(this));
    window.addEventListener("keyup", this._handleKeyUp.bind(this));
  }

  /**
   * Add event listener
   */
  on(event, handler, options) {
    this.svgElement.addEventListener(event, handler, options);

    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push({ handler, options });
  }

  /**
   * Remove event listener
   */
  off(event, handler) {
    this.svgElement.removeEventListener(event, handler);

    if (this.handlers.has(event)) {
      const handlers = this.handlers.get(event);
      const index = handlers.findIndex((h) => h.handler === handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Handle mouse down
   * @private
   */
  _handleMouseDown(event) {
    const point = this.getMousePosition(event);

    if (event.button === 1 || (event.button === 0 && event.spaceKey)) {
      // Middle mouse or space + left mouse = pan
      this.startPan(point);
    } else if (event.button === 0) {
      // Left mouse button
      this.emit("canvas:mousedown", { point, event });
    }
  }

  /**
   * Handle mouse move
   * @private
   */
  _handleMouseMove(event) {
    const point = this.getMousePosition(event);

    if (this.isPanning) {
      this.updatePan(point);
    } else {
      this.emit("canvas:mousemove", { point, event });
    }
  }

  /**
   * Handle mouse up
   * @private
   */
  _handleMouseUp(event) {
    const point = this.getMousePosition(event);

    if (this.isPanning) {
      this.endPan();
    } else {
      this.emit("canvas:mouseup", { point, event });
    }
  }

  /**
   * Handle mouse wheel (zoom)
   * @private
   */
  _handleWheel(event) {
    event.preventDefault();

    const point = this.getMousePosition(event);
    const delta = -event.deltaY * this.options.zoomSpeed;

    this.zoom(delta, point);
  }

  /**
   * Handle touch start
   * @private
   */
  _handleTouchStart(event) {
    // Implement touch handling for mobile
  }

  /**
   * Handle touch move
   * @private
   */
  _handleTouchMove(event) {
    // Implement touch handling for mobile
  }

  /**
   * Handle touch end
   * @private
   */
  _handleTouchEnd(event) {
    // Implement touch handling for mobile
  }

  /**
   * Handle context menu
   * @private
   */
  _handleContextMenu(event) {
    event.preventDefault();
    const point = this.getMousePosition(event);
    this.emit("canvas:contextmenu", { point, event });
  }

  /**
   * Handle key down
   * @private
   */
  _handleKeyDown(event) {
    this.emit("canvas:keydown", { event });
  }

  /**
   * Handle key up
   * @private
   */
  _handleKeyUp(event) {
    this.emit("canvas:keyup", { event });
  }

  /**
   * Get mouse position in canvas coordinates
   */
  getMousePosition(event) {
    const rect = this.svgElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Transform to world coordinates
    return this.screenToWorld({ x, y });
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenPoint) {
    return {
      x: screenPoint.x / this.viewport.zoom - this.viewport.x,
      y: screenPoint.y / this.viewport.zoom - this.viewport.y,
    };
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldPoint) {
    return {
      x: (worldPoint.x + this.viewport.x) * this.viewport.zoom,
      y: (worldPoint.y + this.viewport.y) * this.viewport.zoom,
    };
  }

  /**
   * Start panning
   */
  startPan(point) {
    this.isPanning = true;
    this.panStart = { ...point };
    this.viewportStart = { ...this.viewport };
    this.svgElement.style.cursor = "grabbing";
  }

  /**
   * Update pan position
   */
  updatePan(point) {
    if (!this.isPanning) return;

    const dx = point.x - this.panStart.x;
    const dy = point.y - this.panStart.y;

    this.viewport.x = this.viewportStart.x + dx / this.viewport.zoom;
    this.viewport.y = this.viewportStart.y + dy / this.viewport.zoom;

    this._updateLayerTransforms();
    this.emit("viewport:changed", { viewport: this.viewport });
  }

  /**
   * End panning
   */
  endPan() {
    this.isPanning = false;
    this.svgElement.style.cursor = "default";
  }

  /**
   * Zoom in/out
   */
  zoom(delta, center) {
    const oldZoom = this.viewport.zoom;
    const newZoom = Math.max(
      this.options.minZoom,
      Math.min(this.options.maxZoom, oldZoom + delta)
    );

    if (newZoom === oldZoom) return;

    // Zoom towards center point
    const worldCenter = this.screenToWorld(center);
    this.viewport.zoom = newZoom;
    const newWorldCenter = this.screenToWorld(center);

    this.viewport.x += worldCenter.x - newWorldCenter.x;
    this.viewport.y += worldCenter.y - newWorldCenter.y;

    this._updateLayerTransforms();
    this.emit("viewport:changed", { viewport: this.viewport });
  }

  /**
   * Set zoom level
   */
  setZoom(zoom, center) {
    const delta = zoom - this.viewport.zoom;
    this.zoom(delta, center || this.getCenter());
  }

  /**
   * Reset viewport to default
   */
  resetViewport() {
    this.viewport = { x: 0, y: 0, zoom: 1 };
    this._updateLayerTransforms();
    this.emit("viewport:changed", { viewport: this.viewport });
  }

  /**
   * Fit content in viewport
   */
  fitToContent(padding = 50) {
    // This would calculate bounds of all content and zoom/pan to fit
    // Implementation depends on NodeManager
  }

  /**
   * Get center of viewport
   */
  getCenter() {
    const rect = this.svgElement.getBoundingClientRect();
    return {
      x: rect.width / 2,
      y: rect.height / 2,
    };
  }

  /**
   * Update layer transforms
   * @private
   */
  _updateLayerTransforms() {
    const transform = `translate(${this.viewport.x * this.viewport.zoom}, ${
      this.viewport.y * this.viewport.zoom
    }) scale(${this.viewport.zoom})`;

    this.layers.content.setAttribute("transform", transform);
    this.layers.overlay.setAttribute("transform", transform);

    // Grid doesn't scale, but translates
    if (this.options.gridEnabled) {
      this._renderGrid();
    }
  }

  /**
   * Render grid
   * @private
   */
  _renderGrid() {
    // Clear existing grid
    while (this.layers.grid.firstChild) {
      this.layers.grid.removeChild(this.layers.grid.firstChild);
    }

    if (!this.options.gridEnabled) return;

    const rect = this.svgElement.getBoundingClientRect();
    const gridSize = this.options.gridSize * this.viewport.zoom;
    const offsetX = (this.viewport.x * this.viewport.zoom) % gridSize;
    const offsetY = (this.viewport.y * this.viewport.zoom) % gridSize;

    // Draw vertical lines
    for (let x = offsetX; x < rect.width; x += gridSize) {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", x);
      line.setAttribute("y1", 0);
      line.setAttribute("x2", x);
      line.setAttribute("y2", rect.height);
      line.setAttribute("stroke", "#e0e0e0");
      line.setAttribute("stroke-width", 1);
      this.layers.grid.appendChild(line);
    }

    // Draw horizontal lines
    for (let y = offsetY; y < rect.height; y += gridSize) {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", 0);
      line.setAttribute("y1", y);
      line.setAttribute("x2", rect.width);
      line.setAttribute("y2", y);
      line.setAttribute("stroke", "#e0e0e0");
      line.setAttribute("stroke-width", 1);
      this.layers.grid.appendChild(line);
    }
  }

  /**
   * Set editor mode
   */
  setMode(mode) {
    this.mode = mode;
    this.emit("mode:changed", { mode });
  }

  /**
   * Get editor mode
   */
  getMode() {
    return this.mode;
  }

  /**
   * Set active tool
   */
  setTool(tool) {
    this.tool = tool;
    this.emit("tool:changed", { tool });
  }

  /**
   * Get active tool
   */
  getTool() {
    return this.tool;
  }

  /**
   * Render canvas
   */
  render() {
    this._render();
  }

  /**
   * Internal render method
   * @private
   */
  _render() {
    // Render grid
    if (this.options.gridEnabled) {
      this._renderGrid();
    }

    // Other rendering would be handled by managers
    this.emit("render");
  }

  /**
   * Clear canvas
   */
  clear() {
    // Clear content layer
    while (this.layers.content.firstChild) {
      this.layers.content.removeChild(this.layers.content.firstChild);
    }

    // Clear overlay layer
    while (this.layers.overlay.firstChild) {
      this.layers.overlay.removeChild(this.layers.overlay.firstChild);
    }

    this.emit("canvas:cleared");
  }

  /**
   * Get canvas size
   */
  getSize() {
    const rect = this.svgElement.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
    };
  }

  /**
   * Resize canvas
   */
  resize(width, height) {
    if (width) this.svgElement.setAttribute("width", width);
    if (height) this.svgElement.setAttribute("height", height);

    this._render();
    this.emit("canvas:resized", { width, height });
  }

  /**
   * Export canvas as SVG
   */
  exportSVG() {
    return this.svgElement.outerHTML;
  }

  /**
   * Emit custom event
   */
  emit(event, data) {
    const customEvent = new CustomEvent(event, { detail: data });
    this.svgElement.dispatchEvent(customEvent);
  }

  /**
   * Get layer
   */
  getLayer(name) {
    return this.layers[name];
  }

  /**
   * Destroy editor
   */
  destroy() {
    // Remove event listeners
    window.removeEventListener("keydown", this._handleKeyDown);
    window.removeEventListener("keyup", this._handleKeyUp);

    // Remove all custom event listeners
    for (const [event, handlers] of this.handlers) {
      handlers.forEach(({ handler, options }) => {
        this.svgElement.removeEventListener(event, handler, options);
      });
    }
    this.handlers.clear();

    // Remove canvas
    if (this.svgElement && this.svgElement.parentNode) {
      this.svgElement.parentNode.removeChild(this.svgElement);
    }

    this.emit("editor:destroyed");
  }
}
