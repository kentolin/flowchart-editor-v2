/**
 * Editor.js - SVG Canvas Manager (SIMPLIFIED)
 *
 * Responsibilities:
 * - Create and manage SVG canvas structure
 * - Manage layers (grid, edges, nodes, overlay)
 * - Handle viewport transformations (zoom, pan)
 * - Provide add/remove methods for nodes and edges
 * - Handle canvas-level interactions
 *
 * NOT RESPONSIBLE FOR:
 * - Creating node shapes (NodeView does this)
 * - Node interactions (NodeController does this)
 * - Node business logic (NodeManager does this)
 */

import { DebugLogger } from "../utils/debug/DebugLogger.js";

export class Editor {
  constructor(eventBus, stateManager, container) {
    this.log = DebugLogger.for(this);
    this.log.enter("constructor");

    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.container = container;

    // SVG elements
    this.svg = null;
    this.viewportGroup = null;
    this.defsLayer = null;
    this.gridLayer = null;
    this.edgeLayer = null;
    this.nodeLayer = null;
    this.overlayLayer = null;

    // Viewport state
    this.viewport = {
      x: 0,
      y: 0,
      zoom: 1,
      minZoom: 0.1,
      maxZoom: 5,
    };

    // Grid settings
    this.grid = {
      enabled: true,
      size: 20,
      visible: true,
    };

    // Interaction state
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };

    this.log.exit("constructor");
  }

  /**
   * Initialize the editor
   */
  initialize() {
    this.log.enter("initialize");

    if (!this.container) {
      this.log.error("initialize", "Container element not found");
      throw new Error("Editor container is required");
    }

    this.createSVGStructure();
    this.setupEventHandlers();
    this.renderGrid();
    this.updateTransform();

    this.log.info("initialize", "✓ Editor initialized successfully");
    this.log.exit("initialize");
  }

  /**
   * Create SVG structure with layers
   */
  createSVGStructure() {
    this.log.enter("createSVGStructure");

    // Create main SVG element
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("width", "100%");
    this.svg.setAttribute("height", "100%");
    this.svg.setAttribute("class", "editor-canvas");
    this.svg.style.background = "var(--canvas-background)";

    // Create defs layer for reusable elements
    this.defsLayer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "defs"
    );
    this.svg.appendChild(this.defsLayer);
    this.createArrowMarker();

    // Create viewport group (for zoom/pan transform)
    this.viewportGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.viewportGroup.setAttribute("id", "viewport-group");
    this.svg.appendChild(this.viewportGroup);

    // Create grid layer
    this.gridLayer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.gridLayer.setAttribute("id", "grid-layer");
    this.viewportGroup.appendChild(this.gridLayer);

    // Create edge layer (below nodes)
    this.edgeLayer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.edgeLayer.setAttribute("id", "edge-layer");
    this.viewportGroup.appendChild(this.edgeLayer);

    // Create node layer
    this.nodeLayer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.nodeLayer.setAttribute("id", "node-layer");
    this.viewportGroup.appendChild(this.nodeLayer);

    // Create overlay layer (selection boxes, guides)
    this.overlayLayer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.overlayLayer.setAttribute("id", "overlay-layer");
    this.viewportGroup.appendChild(this.overlayLayer);

    // Append SVG to container
    this.container.appendChild(this.svg);

    this.log.info("createSVGStructure", "✓ SVG structure created");
    this.log.exit("createSVGStructure");
  }

  /**
   * Create arrow marker for edges
   */
  createArrowMarker() {
    const marker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "marker"
    );
    marker.setAttribute("id", "arrowhead");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "10");
    marker.setAttribute("refX", "9");
    marker.setAttribute("refY", "3");
    marker.setAttribute("orient", "auto");
    marker.setAttribute("markerUnits", "strokeWidth");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M0,0 L0,6 L9,3 z");
    path.setAttribute("fill", "#757575");

    marker.appendChild(path);
    this.defsLayer.appendChild(marker);
  }

  /**
   * Setup canvas-level event handlers
   */
  setupEventHandlers() {
    this.log.enter("setupEventHandlers");

    // Mouse wheel for zooming
    this.svg.addEventListener("wheel", (e) => this.handleWheel(e));

    // Mouse events for panning
    this.svg.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    this.svg.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    this.svg.addEventListener("mouseup", (e) => this.handleMouseUp(e));
    this.svg.addEventListener("mouseleave", (e) => this.handleMouseLeave(e));

    // Canvas click event
    this.svg.addEventListener("click", (e) => this.handleClick(e));

    // Context menu
    this.svg.addEventListener("contextmenu", (e) => this.handleContextMenu(e));

    // Drag & drop for shapes
    this.svg.addEventListener("dragover", (e) => this.handleDragOver(e));
    this.svg.addEventListener("drop", (e) => this.handleDrop(e));

    this.log.exit("setupEventHandlers");
  }

  /**
   * Handle mouse wheel (zoom)
   */
  handleWheel(e) {
    e.preventDefault();

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(
      this.viewport.minZoom,
      Math.min(this.viewport.maxZoom, this.viewport.zoom * delta)
    );

    if (newZoom !== this.viewport.zoom) {
      this.viewport.zoom = newZoom;
      this.updateTransform();
      this.emitViewportChanged();
    }
  }

  /**
   * Handle mouse down (start pan)
   */
  handleMouseDown(e) {
    // Only pan with middle mouse or space+left mouse
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      this.isPanning = true;
      this.panStart = { x: e.clientX, y: e.clientY };
      this.svg.style.cursor = "grabbing";
    }
  }

  /**
   * Handle mouse move (pan)
   */
  handleMouseMove(e) {
    if (!this.isPanning) return;

    const dx = e.clientX - this.panStart.x;
    const dy = e.clientY - this.panStart.y;

    this.viewport.x += dx;
    this.viewport.y += dy;

    this.panStart = { x: e.clientX, y: e.clientY };

    this.updateTransform();
    this.emitViewportChanged();
  }

  /**
   * Handle mouse up (end pan)
   */
  handleMouseUp(e) {
    if (this.isPanning) {
      this.isPanning = false;
      this.svg.style.cursor = "default";
    }
  }

  /**
   * Handle mouse leave
   */
  handleMouseLeave(e) {
    if (this.isPanning) {
      this.isPanning = false;
      this.svg.style.cursor = "default";
    }
  }

  /**
   * Handle canvas click
   */
  handleClick(e) {
    // Only trigger if clicked directly on SVG (not on nodes/edges)
    if (e.target === this.svg || e.target === this.viewportGroup) {
      const point = this.screenToSVG(e.clientX, e.clientY);
      this.eventBus.emit("canvas:clicked", point);
    }
  }

  /**
   * Handle context menu
   */
  handleContextMenu(e) {
    e.preventDefault();
    this.eventBus.emit("canvas:contextmenu", {
      clientX: e.clientX,
      clientY: e.clientY,
    });
  }

  /**
   * Handle drag over (for shape drop)
   */
  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  /**
   * Handle drop (create node from dropped shape)
   */
  handleDrop(e) {
    e.preventDefault();

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      const point = this.screenToSVG(e.clientX, e.clientY);

      if (data.shapeType) {
        this.eventBus.emit("shape:dropped", {
          type: data.shapeType,
          x: point.x,
          y: point.y,
        });
      }
    } catch (error) {
      this.log.error("handleDrop", "Failed to handle drop", error);
    }
  }

  /**
   * Update viewport transform
   */
  updateTransform() {
    this.viewportGroup.setAttribute(
      "transform",
      `translate(${this.viewport.x}, ${this.viewport.y}) scale(${this.viewport.zoom})`
    );
  }

  /**
   * Emit viewport changed event
   */
  emitViewportChanged() {
    this.eventBus.emit("viewport:changed", {
      x: this.viewport.x,
      y: this.viewport.y,
      zoom: this.viewport.zoom,
    });
  }

  /**
   * Convert screen coordinates to SVG coordinates
   */
  screenToSVG(clientX, clientY) {
    const rect = this.svg.getBoundingClientRect();
    const x = (clientX - rect.left - this.viewport.x) / this.viewport.zoom;
    const y = (clientY - rect.top - this.viewport.y) / this.viewport.zoom;
    return { x, y };
  }

  /**
   * Render grid
   */
  renderGrid() {
    if (!this.grid.enabled || !this.grid.visible) return;

    this.gridLayer.innerHTML = "";

    const size = this.grid.size;
    const width = 10000;
    const height = 10000;

    // Vertical lines
    for (let x = 0; x <= width; x += size) {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", x);
      line.setAttribute("y1", 0);
      line.setAttribute("x2", x);
      line.setAttribute("y2", height);
      line.setAttribute("stroke", "var(--canvas-grid)");
      line.setAttribute("stroke-width", 1);
      this.gridLayer.appendChild(line);
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += size) {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", 0);
      line.setAttribute("y1", y);
      line.setAttribute("x2", width);
      line.setAttribute("y2", y);
      line.setAttribute("stroke", "var(--canvas-grid)");
      line.setAttribute("stroke-width", 1);
      this.gridLayer.appendChild(line);
    }
  }

  /**
   * Add node element to node layer
   * (Called by NodeManager after creating NodeView)
   */
  addNodeElement(nodeId, nodeElement) {
    this.log.enter("addNodeElement", { nodeId });
    this.nodeLayer.appendChild(nodeElement);
    this.log.exit("addNodeElement");
  }

  /**
   * Remove node element from node layer
   */
  removeNodeElement(nodeId) {
    this.log.enter("removeNodeElement", { nodeId });
    const nodeElement = this.nodeLayer.querySelector(
      `[data-node-id="${nodeId}"]`
    );
    if (nodeElement) {
      this.nodeLayer.removeChild(nodeElement);
    }
    this.log.exit("removeNodeElement");
  }

  /**
   * Add edge element to edge layer
   */
  addEdgeElement(edgeId, edgeElement) {
    this.log.enter("addEdgeElement", { edgeId });
    this.edgeLayer.appendChild(edgeElement);
    this.log.exit("addEdgeElement");
  }

  /**
   * Remove edge element from edge layer
   */
  removeEdgeElement(edgeId) {
    this.log.enter("removeEdgeElement", { edgeId });
    const edgeElement = this.edgeLayer.querySelector(
      `[data-edge-id="${edgeId}"]`
    );
    if (edgeElement) {
      this.edgeLayer.removeChild(edgeElement);
    }
    this.log.exit("removeEdgeElement");
  }

  /**
   * Set viewport
   */
  setViewport(x, y, zoom) {
    this.viewport.x = x;
    this.viewport.y = y;
    this.viewport.zoom = Math.max(
      this.viewport.minZoom,
      Math.min(this.viewport.maxZoom, zoom)
    );
    this.updateTransform();
    this.emitViewportChanged();
  }

  /**
   * Fit all content to view
   */
  fitToView(padding = 50) {
    // Calculate bounding box of all nodes
    const nodes = this.nodeLayer.querySelectorAll(".node");
    if (nodes.length === 0) return;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    nodes.forEach((node) => {
      const transform = node.getAttribute("transform");
      const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
      if (match) {
        const x = parseFloat(match[1]);
        const y = parseFloat(match[2]);
        // Rough estimate - should get actual width/height
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + 120);
        maxY = Math.max(maxY, y + 60);
      }
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const viewportWidth = this.svg.clientWidth;
    const viewportHeight = this.svg.clientHeight;

    const scaleX = (viewportWidth - padding * 2) / contentWidth;
    const scaleY = (viewportHeight - padding * 2) / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const x = viewportWidth / 2 - centerX * scale;
    const y = viewportHeight / 2 - centerY * scale;

    this.setViewport(x, y, scale);
  }

  /**
   * Get SVG element
   */
  getSVG() {
    return this.svg;
  }

  /**
   * Destroy editor
   */
  destroy() {
    this.log.enter("destroy");

    if (this.svg && this.svg.parentNode) {
      this.svg.parentNode.removeChild(this.svg);
    }

    this.svg = null;
    this.viewportGroup = null;
    this.gridLayer = null;
    this.edgeLayer = null;
    this.nodeLayer = null;
    this.overlayLayer = null;

    this.log.exit("destroy");
  }
}
