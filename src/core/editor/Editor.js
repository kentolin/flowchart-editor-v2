import { DebugLogger } from "../../utils/debug/DebugLogger.js";

/**
 * Editor.js - SVG Canvas Manager
 *
 * Manages the SVG canvas, viewport transformations, and canvas-level interactions.
 * Does NOT create nodes directly - delegates to NodeManager.
 *
 * DEPENDENCIES: EventBus only
 *
 * @module core/Editor
 * @version 2.0.0
 */
export class Editor {
  /**
   * Create Editor
   *
   * @param {EventBus} eventBus - Event bus for communication
   */
  constructor(eventBus) {
    this.log = new DebugLogger("Editor", "#00BCD4");
    this.log.enter("constructor");

    // Validate eventBus
    if (!eventBus || typeof eventBus.emit !== "function") {
      this.log.error("constructor", "Invalid EventBus instance");
      throw new Error("Editor: Constructor requires valid EventBus instance");
    }

    this.eventBus = eventBus;
    this.log.info("constructor", "EventBus validated");

    // Container will be set by app.js before initialize()
    this.container = null;

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

    // Pan interaction state
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };

    this.log.info("constructor", "✓ Editor constructed");
    this.log.exit("constructor");
  }

  /**
   * Initialize the editor with DOM container
   *
   * @param {HTMLElement} container - DOM element to render SVG into
   */
  initialize(container) {
    this.log.enter("initialize");

    if (container) {
      this.container = container;
      this.log.info("initialize", "Container set via parameter");
    }

    if (!this.container) {
      this.log.error("initialize", "Container not set");
      throw new Error("Editor.initialize: Container element required");
    }

    this.log.info("initialize", "Creating SVG structure...");
    this.createSVGStructure();

    this.log.info("initialize", "Setting up event handlers...");
    this.setupEventHandlers();

    this.log.info("initialize", "Rendering grid...");
    this.renderGrid();

    this.log.info("initialize", "Updating transform...");
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
    this.svg.setAttribute("class", "editor-canvas");
    this.svg.setAttribute("width", "100%");
    this.svg.setAttribute("height", "100%");
    this.log.info("createSVGStructure", "✓ Main SVG element created");

    // Create defs for markers, patterns, etc.
    this.defsLayer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "defs"
    );

    // Create arrowhead marker
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

    const arrowPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    arrowPath.setAttribute("d", "M0,0 L0,6 L9,3 z");
    arrowPath.setAttribute("fill", "#757575");
    marker.appendChild(arrowPath);
    this.defsLayer.appendChild(marker);
    this.log.info("createSVGStructure", "✓ Arrowhead marker created");

    // Create viewport group (this gets transformed)
    this.viewportGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.viewportGroup.setAttribute("id", "viewport-group");

    // Create layers (order matters for z-index)
    this.gridLayer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.gridLayer.setAttribute("id", "grid-layer");
    this.gridLayer.setAttribute("class", "grid-layer");

    this.edgeLayer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.edgeLayer.setAttribute("id", "edge-layer");
    this.edgeLayer.setAttribute("class", "edge-layer");

    this.nodeLayer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.nodeLayer.setAttribute("id", "node-layer");
    this.nodeLayer.setAttribute("class", "node-layer");

    this.overlayLayer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.overlayLayer.setAttribute("id", "overlay-layer");
    this.overlayLayer.setAttribute("class", "overlay-layer");
    this.log.info("createSVGStructure", "✓ All layers created");

    // Assemble structure
    this.viewportGroup.appendChild(this.gridLayer);
    this.viewportGroup.appendChild(this.edgeLayer);
    this.viewportGroup.appendChild(this.nodeLayer);
    this.viewportGroup.appendChild(this.overlayLayer);

    this.svg.appendChild(this.defsLayer);
    this.svg.appendChild(this.viewportGroup);

    // Append to container
    this.container.appendChild(this.svg);
    this.log.info("createSVGStructure", "✓ SVG appended to container");

    this.log.exit("createSVGStructure");
  }

  /**
   * Setup event handlers for canvas interactions
   */
  setupEventHandlers() {
    this.log.enter("setupEventHandlers");

    // Wheel event for zoom
    this.svg.addEventListener("wheel", this.handleWheel.bind(this), {
      passive: false,
    });
    this.log.info("setupEventHandlers", "✓ Wheel handler registered");

    // Mouse events for pan
    this.svg.addEventListener("mousedown", this.handleMouseDown.bind(this));
    this.svg.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.svg.addEventListener("mouseup", this.handleMouseUp.bind(this));
    this.svg.addEventListener("mouseleave", this.handleMouseLeave.bind(this));
    this.log.info("setupEventHandlers", "✓ Mouse handlers registered");

    // Click event
    this.svg.addEventListener("click", this.handleClick.bind(this));

    // Context menu
    this.svg.addEventListener("contextmenu", this.handleContextMenu.bind(this));

    // Drag and drop
    this.svg.addEventListener("dragover", this.handleDragOver.bind(this));
    this.svg.addEventListener("drop", this.handleDrop.bind(this));
    this.log.info("setupEventHandlers", "✓ Drag/drop handlers registered");

    this.log.exit("setupEventHandlers");
  }

  /**
   * Handle wheel for zoom
   */
  handleWheel(e) {
    e.preventDefault();

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(
      this.viewport.minZoom,
      Math.min(this.viewport.maxZoom, this.viewport.zoom * delta)
    );

    if (newZoom !== this.viewport.zoom) {
      // Zoom towards mouse position
      const beforeZoom = this.screenToSVG(e.clientX, e.clientY);
      this.viewport.zoom = newZoom;
      const afterZoom = this.screenToSVG(e.clientX, e.clientY);

      this.viewport.x += (afterZoom.x - beforeZoom.x) * this.viewport.zoom;
      this.viewport.y += (afterZoom.y - beforeZoom.y) * this.viewport.zoom;

      this.updateTransform();
      this.emitViewportChanged();
    }
  }

  /**
   * Handle mouse down for pan
   */
  handleMouseDown(e) {
    // Middle mouse button or Shift+Left button
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      this.isPanning = true;
      this.panStart = { x: e.clientX, y: e.clientY };
      this.svg.style.cursor = "grabbing";
    }
  }

  /**
   * Handle mouse move for panning
   */
  handleMouseMove(e) {
    if (this.isPanning) {
      const dx = e.clientX - this.panStart.x;
      const dy = e.clientY - this.panStart.y;

      this.viewport.x += dx;
      this.viewport.y += dy;

      this.panStart = { x: e.clientX, y: e.clientY };

      this.updateTransform();
      this.emitViewportChanged();
    }
  }

  /**
   * Handle mouse up
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
    // Only emit if clicking on canvas background (not nodes/edges)
    if (
      e.target === this.svg ||
      e.target === this.viewportGroup ||
      e.target === this.gridLayer
    ) {
      const svgPoint = this.screenToSVG(e.clientX, e.clientY);
      this.eventBus.emit("canvas:clicked", svgPoint);
      this.log.info(
        "handleClick",
        `Canvas clicked at (${svgPoint.x.toFixed(0)}, ${svgPoint.y.toFixed(0)})`
      );
    }
  }

  /**
   * Handle context menu
   */
  handleContextMenu(e) {
    e.preventDefault();
    const svgPoint = this.screenToSVG(e.clientX, e.clientY);
    this.eventBus.emit("canvas:contextmenu", {
      clientX: e.clientX,
      clientY: e.clientY,
      svgX: svgPoint.x,
      svgY: svgPoint.y,
    });
  }

  /**
   * Handle drag over
   */
  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  /**
   * Handle drop
   */
  handleDrop(e) {
    e.preventDefault();

    const shapeType = e.dataTransfer.getData("application/shape-type");
    if (!shapeType) {
      this.log.warn("handleDrop", "No shape type in drag data");
      return;
    }

    const svgPoint = this.screenToSVG(e.clientX, e.clientY);

    this.eventBus.emit("shape:dropped", {
      type: shapeType,
      x: svgPoint.x,
      y: svgPoint.y,
    });

    this.log.info(
      "handleDrop",
      `Shape '${shapeType}' dropped at (${svgPoint.x.toFixed(
        0
      )}, ${svgPoint.y.toFixed(0)})`
    );
  }

  /**
   * Convert screen coordinates to SVG coordinates
   *
   * ⚠️ OPTIMIZED: Uses matrixTransform with native browser matrix math
   * This is faster and more accurate than manual calculation
   *
   * @param {number} clientX - Screen X coordinate
   * @param {number} clientY - Screen Y coordinate
   * @returns {Object} SVG coordinates {x, y}
   */
  screenToSVG(clientX, clientY) {
    const pt = this.svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(this.svg.getScreenCTM().inverse());
  }

  /**
   * Update viewport transform
   */
  updateTransform() {
    const transform = `translate(${this.viewport.x}, ${this.viewport.y}) scale(${this.viewport.zoom})`;
    this.viewportGroup.setAttribute("transform", transform);
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
   * Render grid
   */
  renderGrid() {
    if (!this.grid.visible) {
      this.log.info("renderGrid", "Grid not visible, skipping");
      return;
    }

    this.log.enter("renderGrid");

    // Clear existing grid
    while (this.gridLayer.firstChild) {
      this.gridLayer.removeChild(this.gridLayer.firstChild);
    }

    const gridSize = this.grid.size;
    const width = 5000;
    const height = 5000;

    // Create grid pattern
    const pattern = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "pattern"
    );
    pattern.setAttribute("id", "grid-pattern");
    pattern.setAttribute("width", gridSize);
    pattern.setAttribute("height", gridSize);
    pattern.setAttribute("patternUnits", "userSpaceOnUse");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${gridSize} 0 L 0 0 0 ${gridSize}`);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#e0e0e0");
    path.setAttribute("stroke-width", "1");

    pattern.appendChild(path);
    this.defsLayer.appendChild(pattern);

    // Create grid rectangle
    const gridRect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    gridRect.setAttribute("width", width);
    gridRect.setAttribute("height", height);
    gridRect.setAttribute("x", -width / 2);
    gridRect.setAttribute("y", -height / 2);
    gridRect.setAttribute("fill", "url(#grid-pattern)");

    this.gridLayer.appendChild(gridRect);

    this.log.info("renderGrid", "✓ Grid rendered");
    this.log.exit("renderGrid");
  }

  /**
   * Add node element to canvas
   *
   * Called by NodeManager after node is created
   *
   * @param {string} nodeId - Node identifier
   * @param {SVGElement} nodeElement - SVG group element for the node
   */
  addNodeElement(nodeId, nodeElement) {
    this.log.enter("addNodeElement", { nodeId });

    if (!nodeElement) {
      this.log.error("addNodeElement", "nodeElement is null/undefined");
      throw new Error("Editor.addNodeElement: nodeElement is required");
    }

    this.nodeLayer.appendChild(nodeElement);
    this.log.info("addNodeElement", `✓ Node '${nodeId}' added to canvas`);
    this.log.exit("addNodeElement");
  }

  /**
   * Update node element on canvas
   *
   * Called by NodeManager when node is updated
   *
   * @param {string} nodeId - Node identifier
   * @param {SVGElement} newNodeElement - New SVG group element
   */
  updateNodeElement(nodeId, newNodeElement) {
    this.log.enter("updateNodeElement", { nodeId });

    const oldElement = this.nodeLayer.querySelector(
      `[data-node-id="${nodeId}"]`
    );
    if (oldElement) {
      this.nodeLayer.replaceChild(newNodeElement, oldElement);
      this.log.info(
        "updateNodeElement",
        `✓ Node '${nodeId}' updated on canvas`
      );
    } else {
      this.log.warn(
        "updateNodeElement",
        `Node '${nodeId}' not found, adding instead`
      );
      this.nodeLayer.appendChild(newNodeElement);
    }

    this.log.exit("updateNodeElement");
  }

  /**
   * Remove node element from canvas
   *
   * Called by NodeManager when node is deleted
   *
   * @param {string} nodeId - Node identifier
   */
  removeNodeElement(nodeId) {
    this.log.enter("removeNodeElement", { nodeId });

    const nodeElement = this.nodeLayer.querySelector(
      `[data-node-id="${nodeId}"]`
    );
    if (nodeElement) {
      this.nodeLayer.removeChild(nodeElement);
      this.log.info(
        "removeNodeElement",
        `✓ Node '${nodeId}' removed from canvas`
      );
    } else {
      this.log.warn(
        "removeNodeElement",
        `Node '${nodeId}' not found on canvas`
      );
    }

    this.log.exit("removeNodeElement");
  }

  /**
   * Add edge element to canvas
   *
   * Called by EdgeManager after edge is created
   *
   * @param {string} edgeId - Edge identifier
   * @param {SVGElement} edgeElement - SVG element for the edge
   */
  addEdgeElement(edgeId, edgeElement) {
    this.log.enter("addEdgeElement", { edgeId });

    if (!edgeElement) {
      this.log.error("addEdgeElement", "edgeElement is null/undefined");
      throw new Error("Editor.addEdgeElement: edgeElement is required");
    }

    this.edgeLayer.appendChild(edgeElement);
    this.log.info("addEdgeElement", `✓ Edge '${edgeId}' added to canvas`);
    this.log.exit("addEdgeElement");
  }

  /**
   * Update edge element on canvas
   *
   * Called by EdgeManager when edge is updated
   *
   * @param {string} edgeId - Edge identifier
   * @param {SVGElement} newEdgeElement - New SVG element
   */
  updateEdgeElement(edgeId, newEdgeElement) {
    this.log.enter("updateEdgeElement", { edgeId });

    const oldElement = this.edgeLayer.querySelector(
      `[data-edge-id="${edgeId}"]`
    );
    if (oldElement) {
      this.edgeLayer.replaceChild(newEdgeElement, oldElement);
      this.log.info(
        "updateEdgeElement",
        `✓ Edge '${edgeId}' updated on canvas`
      );
    } else {
      this.log.warn(
        "updateEdgeElement",
        `Edge '${edgeId}' not found, adding instead`
      );
      this.edgeLayer.appendChild(newEdgeElement);
    }

    this.log.exit("updateEdgeElement");
  }

  /**
   * Remove edge element from canvas
   *
   * Called by EdgeManager when edge is deleted
   *
   * @param {string} edgeId - Edge identifier
   */
  removeEdgeElement(edgeId) {
    this.log.enter("removeEdgeElement", { edgeId });

    const edgeElement = this.edgeLayer.querySelector(
      `[data-edge-id="${edgeId}"]`
    );
    if (edgeElement) {
      this.edgeLayer.removeChild(edgeElement);
      this.log.info(
        "removeEdgeElement",
        `✓ Edge '${edgeId}' removed from canvas`
      );
    } else {
      this.log.warn(
        "removeEdgeElement",
        `Edge '${edgeId}' not found on canvas`
      );
    }

    this.log.exit("removeEdgeElement");
  }

  /**
   * Set viewport position and zoom
   *
   * @param {number} x - X offset
   * @param {number} y - Y offset
   * @param {number} zoom - Zoom level
   */
  setViewport(x, y, zoom) {
    this.log.enter("setViewport", { x, y, zoom });

    this.viewport.x = x;
    this.viewport.y = y;
    this.viewport.zoom = Math.max(
      this.viewport.minZoom,
      Math.min(this.viewport.maxZoom, zoom)
    );

    this.updateTransform();
    this.emitViewportChanged();

    this.log.exit("setViewport");
  }

  /**
   * Get current viewport state
   *
   * @returns {Object} Viewport state {x, y, zoom, minZoom, maxZoom}
   */
  getViewport() {
    return { ...this.viewport };
  }

  /**
   * Fit all nodes to view
   *
   * @param {number} padding - Padding around content (default 50)
   */
  fitToView(padding = 50) {
    this.log.enter("fitToView", { padding });

    const nodes = this.nodeLayer.querySelectorAll("[data-node-id]");
    if (nodes.length === 0) {
      this.log.info("fitToView", "No nodes to fit");
      this.log.exit("fitToView");
      return;
    }

    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    // Calculate bounds
    nodes.forEach((node) => {
      const bbox = node.getBBox();
      const transform = node.getAttribute("transform") || "";
      const match = transform.match(/translate\(([^,]+),([^)]+)\)/);

      if (match) {
        const x = parseFloat(match[1]);
        const y = parseFloat(match[2]);

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + bbox.width);
        maxY = Math.max(maxY, y + bbox.height);
      }
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const contentCenterX = (minX + maxX) / 2;
    const contentCenterY = (minY + maxY) / 2;

    const svgRect = this.svg.getBoundingClientRect();
    const scaleX = (svgRect.width - padding * 2) / contentWidth;
    const scaleY = (svgRect.height - padding * 2) / contentHeight;
    const zoom = Math.min(scaleX, scaleY, this.viewport.maxZoom);

    this.viewport.zoom = zoom;
    this.viewport.x = svgRect.width / 2 - contentCenterX * zoom;
    this.viewport.y = svgRect.height / 2 - contentCenterY * zoom;

    this.updateTransform();
    this.emitViewportChanged();

    this.log.info("fitToView", `✓ Fitted to zoom ${(zoom * 100).toFixed(0)}%`);
    this.log.exit("fitToView");
  }

  /**
   * Get SVG element
   *
   * @returns {SVGElement} The main SVG element
   */
  getSVG() {
    return this.svg;
  }

  /**
   * Toggle grid visibility
   *
   * @param {boolean} visible - Grid visibility (optional, toggles if not provided)
   */
  toggleGrid(visible) {
    this.log.enter("toggleGrid", { visible });

    if (visible === undefined) {
      this.grid.visible = !this.grid.visible;
    } else {
      this.grid.visible = visible;
    }

    if (this.grid.visible) {
      this.renderGrid();
    } else {
      while (this.gridLayer.firstChild) {
        this.gridLayer.removeChild(this.gridLayer.firstChild);
      }
    }

    this.log.info("toggleGrid", `Grid visibility: ${this.grid.visible}`);
    this.log.exit("toggleGrid");
  }

  /**
   * Destroy editor and cleanup
   */
  destroy() {
    this.log.enter("destroy");

    // Remove event listeners
    if (this.svg) {
      this.svg.removeEventListener("wheel", this.handleWheel);
      this.svg.removeEventListener("mousedown", this.handleMouseDown);
      this.svg.removeEventListener("mousemove", this.handleMouseMove);
      this.svg.removeEventListener("mouseup", this.handleMouseUp);
      this.svg.removeEventListener("mouseleave", this.handleMouseLeave);
      this.svg.removeEventListener("click", this.handleClick);
      this.svg.removeEventListener("contextmenu", this.handleContextMenu);
      this.svg.removeEventListener("dragover", this.handleDragOver);
      this.svg.removeEventListener("drop", this.handleDrop);
      this.log.info("destroy", "✓ Event listeners removed");
    }

    // Remove SVG from DOM
    if (this.svg && this.container) {
      this.container.removeChild(this.svg);
      this.log.info("destroy", "✓ SVG removed from DOM");
    }

    // Clear references
    this.svg = null;
    this.viewportGroup = null;
    this.defsLayer = null;
    this.gridLayer = null;
    this.edgeLayer = null;
    this.nodeLayer = null;
    this.overlayLayer = null;

    this.log.info("destroy", "✓ Editor destroyed");
    this.log.exit("destroy");
  }

  /**
   * Print debug info
   */
  printDebugInfo() {
    console.log("========== Editor Debug Info ==========");
    console.log(
      `Viewport: (${this.viewport.x.toFixed(0)}, ${this.viewport.y.toFixed(0)})`
    );
    console.log(`Zoom: ${(this.viewport.zoom * 100).toFixed(0)}%`);
    console.log(
      `Grid: ${this.grid.visible ? "visible" : "hidden"} (${this.grid.size}px)`
    );
    console.log(`Nodes on canvas: ${this.nodeLayer?.children.length || 0}`);
    console.log(`Edges on canvas: ${this.edgeLayer?.children.length || 0}`);
    console.log(`Panning: ${this.isPanning}`);
    console.log("=".repeat(39));
  }
}
