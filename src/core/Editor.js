/**
 * Editor.js - Main SVG Canvas Manager
 *
 * Responsibilities:
 * - Create and manage SVG canvas
 * - Handle viewport transformations (zoom, pan)
 * - Manage node and edge layers
 * - Provide rendering API for shapes
 * - Handle canvas interactions
 */

import { DebugLogger } from "../utils/debug/DebugLogger.js";

export class Editor {
  constructor(eventBus, stateManager, container) {
    this.log = new DebugLogger("Editor", "#2196F3");
    this.log.enter("constructor", { container });

    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.container = container;

    // SVG elements
    this.svg = null;
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

    // Canvas size
    this.canvasSize = {
      width: 10000,
      height: 10000,
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

    this.log.info("initialize", "Creating SVG structure...");
    this.createSVGStructure();

    this.log.info("initialize", "Setting up event handlers...");
    this.setupEventHandlers();

    this.log.info("initialize", "Rendering grid...");
    this.renderGrid();

    this.log.info("initialize", "Applying initial viewport...");
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

    this.log.info("createSVGStructure", "Created main SVG element");

    // Create defs for reusable elements (markers, patterns, etc.)
    this.defsLayer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "defs"
    );
    this.svg.appendChild(this.defsLayer);
    this.log.info("createSVGStructure", "Created defs layer");

    // Add arrow marker for edges
    this.createArrowMarker();

    // Create main group for viewport transformation
    const viewportGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    viewportGroup.setAttribute("id", "viewport-group");
    this.svg.appendChild(viewportGroup);

    // Create grid layer
    this.gridLayer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.gridLayer.setAttribute("id", "grid-layer");
    this.gridLayer.setAttribute("class", "grid-layer");
    viewportGroup.appendChild(this.gridLayer);
    this.log.info("createSVGStructure", "Created grid layer");

    // Create edge layer (below nodes)
    this.edgeLayer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.edgeLayer.setAttribute("id", "edge-layer");
    this.edgeLayer.setAttribute("class", "edge-layer");
    viewportGroup.appendChild(this.edgeLayer);
    this.log.info("createSVGStructure", "Created edge layer");

    // Create node layer
    this.nodeLayer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.nodeLayer.setAttribute("id", "node-layer");
    this.nodeLayer.setAttribute("class", "node-layer");
    viewportGroup.appendChild(this.nodeLayer);
    this.log.info("createSVGStructure", "Created node layer");

    // Create overlay layer (selection boxes, handles, etc.)
    this.overlayLayer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.overlayLayer.setAttribute("id", "overlay-layer");
    this.overlayLayer.setAttribute("class", "overlay-layer");
    viewportGroup.appendChild(this.overlayLayer);
    this.log.info("createSVGStructure", "Created overlay layer");

    // Store viewport group reference
    this.viewportGroup = viewportGroup;

    // Append SVG to container
    this.container.appendChild(this.svg);
    this.log.info("createSVGStructure", "Appended SVG to container");

    this.log.exit("createSVGStructure");
  }

  /**
   * Setup event handlers for canvas interactions
   */
  setupEventHandlers() {
    this.log.enter("setupEventHandlers");

    // Mouse wheel for zooming
    this.svg.addEventListener("wheel", (e) => this.handleWheel(e));
    this.log.info("setupEventHandlers", "Attached wheel event");

    // Mouse events for panning
    this.svg.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    this.svg.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    this.svg.addEventListener("mouseup", (e) => this.handleMouseUp(e));
    this.svg.addEventListener("mouseleave", (e) => this.handleMouseLeave(e));
    this.log.info("setupEventHandlers", "Attached mouse events for panning");

    // Canvas click event
    this.svg.addEventListener("click", (e) => this.handleClick(e));
    this.log.info("setupEventHandlers", "Attached click event");

    // Context menu
    this.svg.addEventListener("contextmenu", (e) => this.handleContextMenu(e));
    this.log.info("setupEventHandlers", "Attached context menu event");

    // Drop event for shapes
    this.svg.addEventListener("dragover", (e) => this.handleDragOver(e));
    this.svg.addEventListener("drop", (e) => this.handleDrop(e));
    this.log.info("setupEventHandlers", "Attached drag & drop events");

    this.log.exit("setupEventHandlers");
  }

  /**
   * Handle mouse wheel for zooming
   */
  handleWheel(e) {
    this.log.enter("handleWheel", { deltaY: e.deltaY });

    e.preventDefault();

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(
      this.viewport.minZoom,
      Math.min(this.viewport.maxZoom, this.viewport.zoom * delta)
    );

    if (newZoom !== this.viewport.zoom) {
      // Get mouse position in SVG coordinates
      const rect = this.svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate zoom center
      const zoomPointX = (mouseX - this.viewport.x) / this.viewport.zoom;
      const zoomPointY = (mouseY - this.viewport.y) / this.viewport.zoom;

      // Update zoom
      this.viewport.zoom = newZoom;

      // Adjust pan to keep zoom point fixed
      this.viewport.x = mouseX - zoomPointX * this.viewport.zoom;
      this.viewport.y = mouseY - zoomPointY * this.viewport.zoom;

      this.log.info("handleWheel", `Zoom: ${this.viewport.zoom.toFixed(2)}`);
      this.updateTransform();

      // Emit viewport changed event
      this.eventBus.emit("viewport:changed", { ...this.viewport });
    }

    this.log.exit("handleWheel");
  }

  /**
   * Handle mouse down for panning
   */
  handleMouseDown(e) {
    // Only pan with middle mouse button or spacebar + left click
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      this.log.enter("handleMouseDown", {
        button: e.button,
        shiftKey: e.shiftKey,
      });

      e.preventDefault();
      this.isPanning = true;
      this.panStart = {
        x: e.clientX - this.viewport.x,
        y: e.clientY - this.viewport.y,
      };
      this.svg.style.cursor = "grabbing";

      this.log.info("handleMouseDown", "Started panning");
      this.log.exit("handleMouseDown");
    }
  }

  /**
   * Handle mouse move for panning
   */
  handleMouseMove(e) {
    if (this.isPanning) {
      this.viewport.x = e.clientX - this.panStart.x;
      this.viewport.y = e.clientY - this.panStart.y;

      this.updateTransform();

      // Emit viewport changed event
      this.eventBus.emit("viewport:changed", { ...this.viewport });
    }
  }

  /**
   * Handle mouse up to stop panning
   */
  handleMouseUp(e) {
    if (this.isPanning) {
      this.log.enter("handleMouseUp");

      this.isPanning = false;
      this.svg.style.cursor = "default";

      this.log.info("handleMouseUp", "Stopped panning");
      this.log.exit("handleMouseUp");
    }
  }

  /**
   * Handle mouse leave to stop panning
   */
  handleMouseLeave(e) {
    if (this.isPanning) {
      this.log.enter("handleMouseLeave");

      this.isPanning = false;
      this.svg.style.cursor = "default";

      this.log.info("handleMouseLeave", "Stopped panning (mouse left canvas)");
      this.log.exit("handleMouseLeave");
    }
  }

  /**
   * Handle canvas click
   */
  handleClick(e) {
    // Only handle clicks on the canvas itself, not on nodes/edges
    if (e.target === this.svg || e.target === this.gridLayer) {
      this.log.enter("handleClick", { x: e.clientX, y: e.clientY });

      const point = this.screenToCanvas(e.clientX, e.clientY);
      this.log.info(
        "handleClick",
        `Canvas clicked at (${point.x}, ${point.y})`
      );

      this.eventBus.emit("canvas:clicked", point);

      this.log.exit("handleClick");
    }
  }

  /**
   * Handle context menu
   */
  handleContextMenu(e) {
    this.log.enter("handleContextMenu");

    e.preventDefault();
    const point = this.screenToCanvas(e.clientX, e.clientY);

    this.log.info(
      "handleContextMenu",
      `Context menu at (${point.x}, ${point.y})`
    );
    this.eventBus.emit("canvas:contextmenu", {
      ...point,
      clientX: e.clientX,
      clientY: e.clientY,
    });

    this.log.exit("handleContextMenu");
  }

  /**
   * Handle drag over for drop acceptance
   */
  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  /**
   * Handle drop for shape creation
   */
  handleDrop(e) {
    this.log.enter("handleDrop");

    e.preventDefault();

    try {
      const shapeType = e.dataTransfer.getData("application/shape-type");
      if (shapeType) {
        const point = this.screenToCanvas(e.clientX, e.clientY);
        this.log.info(
          "handleDrop",
          `Shape '${shapeType}' dropped at (${point.x}, ${point.y})`
        );

        // Emit event for NodeManager to handle node creation
        this.eventBus.emit("shape:dropped", {
          type: shapeType,
          x: point.x,
          y: point.y,
          source: "drop",
        });
      } else {
        this.log.warn("handleDrop", "No shape type in drop data");
      }
    } catch (error) {
      this.log.error("handleDrop", "Failed to handle drop", error);
    }

    this.log.exit("handleDrop");
  }

  /**
   * Render a node shape using ShapeRegistry
   * This method creates the SVG representation of a shape
   */
  renderNode(nodeId, nodeData, shapeDefinition) {
    this.log.enter("renderNode", { nodeId, type: nodeData.type });

    try {
      // Create node group
      const nodeGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      nodeGroup.setAttribute("data-node-id", nodeId);
      nodeGroup.setAttribute("class", "node");
      nodeGroup.setAttribute(
        "transform",
        `translate(${nodeData.x}, ${nodeData.y})`
      );

      // Get shape from registry
      const shape = shapeDefinition || this.getShapeDefinition(nodeData.type);
      if (!shape) {
        this.log.error(
          "renderNode",
          `Shape definition not found for type: ${nodeData.type}`
        );
        return null;
      }

      // Create shape path/element based on shape type
      const shapeElement = this.createShapeElement(shape, nodeData);
      nodeGroup.appendChild(shapeElement);

      // Add label if exists
      if (nodeData.label) {
        const labelElement = this.createLabelElement(nodeData, shape);
        nodeGroup.appendChild(labelElement);
      }

      // Add connection ports (hidden by default, shown on hover)
      const portsGroup = this.createPortsGroup(nodeId, nodeData, shape);
      portsGroup.style.display = "none";
      portsGroup.setAttribute("class", "ports-group");
      nodeGroup.appendChild(portsGroup);

      // Add resize handles (hidden by default, shown on selection)
      const handlesGroup = this.createResizeHandles(nodeId, nodeData);
      handlesGroup.style.display = "none";
      handlesGroup.setAttribute("class", "handles-group");
      nodeGroup.appendChild(handlesGroup);

      // Setup event handlers for node interactions
      this.setupNodeInteractions(nodeGroup, nodeId, nodeData);

      // Add to node layer
      this.addNodeElement(nodeId, nodeGroup);

      this.log.info("renderNode", `✓ Node '${nodeId}' rendered successfully`);
      this.log.exit("renderNode");

      return nodeGroup;
    } catch (error) {
      this.log.error("renderNode", `Failed to render node ${nodeId}`, error);
      this.log.exit("renderNode");
      return null;
    }
  }

  /**
   * Create SVG shape element based on shape definition
   */
  createShapeElement(shape, nodeData) {
    this.log.enter("createShapeElement", { type: shape.type });

    const width = nodeData.width || shape.defaultWidth || 120;
    const height = nodeData.height || shape.defaultHeight || 60;
    const style = { ...shape.defaultStyle, ...nodeData.style };

    let element;

    switch (shape.type) {
      case "rect":
      case "process":
        element = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        element.setAttribute("x", 0);
        element.setAttribute("y", 0);
        element.setAttribute("width", width);
        element.setAttribute("height", height);
        element.setAttribute("rx", style.borderRadius || 0);
        break;

      case "circle":
        element = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle"
        );
        const radius = Math.min(width, height) / 2;
        element.setAttribute("cx", width / 2);
        element.setAttribute("cy", height / 2);
        element.setAttribute("r", radius);
        break;

      case "ellipse":
        element = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "ellipse"
        );
        element.setAttribute("cx", width / 2);
        element.setAttribute("cy", height / 2);
        element.setAttribute("rx", width / 2);
        element.setAttribute("ry", height / 2);
        break;

      case "diamond":
      case "decision":
        element = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        const diamondPath = `M ${width / 2} 0 L ${width} ${height / 2} L ${
          width / 2
        } ${height} L 0 ${height / 2} Z`;
        element.setAttribute("d", diamondPath);
        break;

      case "terminator":
        element = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        element.setAttribute("x", 0);
        element.setAttribute("y", 0);
        element.setAttribute("width", width);
        element.setAttribute("height", height);
        element.setAttribute("rx", height / 2);
        break;

      default:
        // Default to rectangle
        element = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        element.setAttribute("x", 0);
        element.setAttribute("y", 0);
        element.setAttribute("width", width);
        element.setAttribute("height", height);
        break;
    }

    // Apply styles
    element.setAttribute("fill", style.fill || "#ffffff");
    element.setAttribute("stroke", style.stroke || "#424242");
    element.setAttribute("stroke-width", style.strokeWidth || 2);
    element.setAttribute("class", "shape-element");

    this.log.exit("createShapeElement");
    return element;
  }

  /**
   * Create label element for node
   */
  createLabelElement(nodeData, shape) {
    const width = nodeData.width || shape.defaultWidth || 120;
    const height = nodeData.height || shape.defaultHeight || 60;

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", width / 2);
    text.setAttribute("y", height / 2);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("fill", nodeData.style?.color || "#000000");
    text.setAttribute("font-size", nodeData.style?.fontSize || "14");
    text.setAttribute("font-family", "Arial, sans-serif");
    text.setAttribute("class", "node-label");
    text.textContent = nodeData.label;

    return text;
  }

  /**
   * Create connection ports for node
   */
  createPortsGroup(nodeId, nodeData, shape) {
    this.log.enter("createPortsGroup");

    const portsGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    portsGroup.setAttribute("class", "ports");

    const width = nodeData.width || shape.defaultWidth || 120;
    const height = nodeData.height || shape.defaultHeight || 60;

    // Define port positions (top, right, bottom, left)
    const ports = [
      { id: "top", x: width / 2, y: 0, position: "top" },
      { id: "right", x: width, y: height / 2, position: "right" },
      { id: "bottom", x: width / 2, y: height, position: "bottom" },
      { id: "left", x: 0, y: height / 2, position: "left" },
    ];

    ports.forEach((port) => {
      const portCircle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      portCircle.setAttribute("cx", port.x);
      portCircle.setAttribute("cy", port.y);
      portCircle.setAttribute("r", 6);
      portCircle.setAttribute("fill", "#2196F3");
      portCircle.setAttribute("stroke", "#ffffff");
      portCircle.setAttribute("stroke-width", 2);
      portCircle.setAttribute("class", "port");
      portCircle.setAttribute("data-port-id", port.id);
      portCircle.setAttribute("data-port-position", port.position);
      portCircle.setAttribute("data-node-id", nodeId);
      portCircle.style.cursor = "crosshair";

      // Port interaction handlers
      portCircle.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        this.handlePortMouseDown(e, nodeId, port);
      });

      portsGroup.appendChild(portCircle);
    });

    this.log.exit("createPortsGroup");
    return portsGroup;
  }

  /**
   * Create resize handles for node
   */
  createResizeHandles(nodeId, nodeData) {
    this.log.enter("createResizeHandles");

    const handlesGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    handlesGroup.setAttribute("class", "resize-handles");

    const width = nodeData.width || 120;
    const height = nodeData.height || 60;

    // Define handle positions (corners and sides)
    const handles = [
      { id: "nw", x: 0, y: 0, cursor: "nw-resize" },
      { id: "n", x: width / 2, y: 0, cursor: "n-resize" },
      { id: "ne", x: width, y: 0, cursor: "ne-resize" },
      { id: "e", x: width, y: height / 2, cursor: "e-resize" },
      { id: "se", x: width, y: height, cursor: "se-resize" },
      { id: "s", x: width / 2, y: height, cursor: "s-resize" },
      { id: "sw", x: 0, y: height, cursor: "sw-resize" },
      { id: "w", x: 0, y: height / 2, cursor: "w-resize" },
    ];

    handles.forEach((handle) => {
      const handleRect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      handleRect.setAttribute("x", handle.x - 4);
      handleRect.setAttribute("y", handle.y - 4);
      handleRect.setAttribute("width", 8);
      handleRect.setAttribute("height", 8);
      handleRect.setAttribute("fill", "#ffffff");
      handleRect.setAttribute("stroke", "#2196F3");
      handleRect.setAttribute("stroke-width", 2);
      handleRect.setAttribute("class", "resize-handle");
      handleRect.setAttribute("data-handle-id", handle.id);
      handleRect.setAttribute("data-node-id", nodeId);
      handleRect.style.cursor = handle.cursor;

      // Handle interaction handlers
      handleRect.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        this.handleResizeStart(e, nodeId, handle);
      });

      handlesGroup.appendChild(handleRect);
    });

    this.log.exit("createResizeHandles");
    return handlesGroup;
  }

  /**
   * Setup node interaction handlers
   */
  setupNodeInteractions(nodeGroup, nodeId, nodeData) {
    this.log.enter("setupNodeInteractions", { nodeId });

    // Drag state
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let nodeStartX = 0;
    let nodeStartY = 0;

    // Get the shape element for drag initiation
    const shapeElement = nodeGroup.querySelector(".shape-element");

    // Mouse down - start drag
    const handleMouseDown = (e) => {
      if (e.button !== 0) return; // Only left mouse button

      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;

      // Get current position from transform
      const transform = nodeGroup.getAttribute("transform");
      const match = transform
        ? transform.match(/translate\(([^,]+),\s*([^)]+)\)/)
        : null;
      nodeStartX = match ? parseFloat(match[1]) : 0;
      nodeStartY = match ? parseFloat(match[2]) : 0;

      e.stopPropagation();
      this.log.info("setupNodeInteractions", `Drag started on node ${nodeId}`);
    };

    // Mouse move - drag node
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;

      const newX = nodeStartX + deltaX;
      const newY = nodeStartY + deltaY;

      nodeGroup.setAttribute("transform", `translate(${newX}, ${newY})`);
    };

    // Mouse up - end drag
    const handleMouseUp = (e) => {
      if (!isDragging) return;

      isDragging = false;

      // Get final position
      const transform = nodeGroup.getAttribute("transform");
      const match = transform
        ? transform.match(/translate\(([^,]+),\s*([^)]+)\)/)
        : null;
      const finalX = match ? parseFloat(match[1]) : 0;
      const finalY = match ? parseFloat(match[2]) : 0;

      // Emit node moved event
      this.eventBus.emit("node:moved", { nodeId, x: finalX, y: finalY });

      this.log.info(
        "setupNodeInteractions",
        `Node ${nodeId} moved to (${finalX}, ${finalY})`
      );
    };

    // Attach drag handlers
    if (shapeElement) {
      shapeElement.addEventListener("mousedown", handleMouseDown);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    // Hover to show ports
    nodeGroup.addEventListener("mouseenter", () => {
      const portsGroup = nodeGroup.querySelector(".ports-group");
      if (portsGroup) {
        portsGroup.style.display = "block";
      }
    });

    nodeGroup.addEventListener("mouseleave", () => {
      const portsGroup = nodeGroup.querySelector(".ports-group");
      if (portsGroup) {
        portsGroup.style.display = "none";
      }
    });

    // Click to select and show resize handles
    nodeGroup.addEventListener("click", (e) => {
      // Don't trigger if we just finished dragging
      if (
        Math.abs(e.clientX - dragStartX) > 5 ||
        Math.abs(e.clientY - dragStartY) > 5
      ) {
        return;
      }

      e.stopPropagation();
      this.log.info("setupNodeInteractions", `Node ${nodeId} clicked`);

      // Hide all other resize handles
      this.nodeLayer.querySelectorAll(".handles-group").forEach((group) => {
        group.style.display = "none";
      });

      // Show this node's resize handles
      const handlesGroup = nodeGroup.querySelector(".handles-group");
      if (handlesGroup) {
        handlesGroup.style.display = "block";
      }

      // Emit selection event
      this.eventBus.emit("node:selected", { nodeId, nodeData });
    });

    // Double-click to edit label
    nodeGroup.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      this.log.info("setupNodeInteractions", `Node ${nodeId} double-clicked`);
      this.eventBus.emit("node:edit", { nodeId, nodeData });
    });

    this.log.exit("setupNodeInteractions");
  }

  /**
   * Handle port mouse down (start edge creation)
   */
  handlePortMouseDown(e, nodeId, port) {
    this.log.enter("handlePortMouseDown", { nodeId, portId: port.id });

    e.stopPropagation();

    this.log.info(
      "handlePortMouseDown",
      `Starting edge from node ${nodeId}, port ${port.id}`
    );

    // Emit event for EdgeManager to handle edge creation
    this.eventBus.emit("port:mousedown", {
      nodeId,
      portId: port.id,
      portPosition: port.position,
      clientX: e.clientX,
      clientY: e.clientY,
    });

    this.log.exit("handlePortMouseDown");
  }

  /**
   * Handle resize start
   */
  handleResizeStart(e, nodeId, handle) {
    this.log.enter("handleResizeStart", { nodeId, handleId: handle.id });

    e.stopPropagation();

    this.log.info(
      "handleResizeStart",
      `Starting resize of node ${nodeId} from handle ${handle.id}`
    );

    // Emit event for NodeManager to handle resizing
    this.eventBus.emit("node:resizestart", {
      nodeId,
      handleId: handle.id,
      clientX: e.clientX,
      clientY: e.clientY,
    });

    this.log.exit("handleResizeStart");
  }

  /**
   * Get shape definition from ShapeRegistry
   */
  getShapeDefinition(shapeType) {
    this.log.enter("getShapeDefinition", { shapeType });

    // This would be injected via constructor or retrieved from container
    // For now, return a basic definition
    const basicShapes = {
      rect: {
        type: "rect",
        defaultWidth: 120,
        defaultHeight: 60,
        defaultStyle: {},
      },
      circle: {
        type: "circle",
        defaultWidth: 80,
        defaultHeight: 80,
        defaultStyle: {},
      },
      diamond: {
        type: "diamond",
        defaultWidth: 120,
        defaultHeight: 80,
        defaultStyle: {},
      },
      process: {
        type: "process",
        defaultWidth: 120,
        defaultHeight: 60,
        defaultStyle: {},
      },
      decision: {
        type: "decision",
        defaultWidth: 120,
        defaultHeight: 80,
        defaultStyle: {},
      },
      terminator: {
        type: "terminator",
        defaultWidth: 140,
        defaultHeight: 60,
        defaultStyle: {},
      },
    };

    const shape = basicShapes[shapeType];

    this.log.exit("getShapeDefinition");
    return shape || basicShapes.rect;
  }

  /**
   * Render an edge connection between nodes
   */
  renderEdge(edgeId, edgeData) {
    this.log.enter("renderEdge", {
      edgeId,
      sourceId: edgeData.sourceId,
      targetId: edgeData.targetId,
    });

    try {
      // Create edge group
      const edgeGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      edgeGroup.setAttribute("data-edge-id", edgeId);
      edgeGroup.setAttribute("class", "edge");

      // Calculate path based on source and target positions
      const path = this.calculateEdgePath(edgeData);

      // Create path element
      const pathElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      pathElement.setAttribute("d", path);
      pathElement.setAttribute("fill", "none");
      pathElement.setAttribute("stroke", edgeData.style?.stroke || "#757575");
      pathElement.setAttribute(
        "stroke-width",
        edgeData.style?.strokeWidth || 2
      );
      pathElement.setAttribute("class", "edge-path");

      // Add arrow marker
      pathElement.setAttribute("marker-end", "url(#arrowhead)");

      edgeGroup.appendChild(pathElement);

      // Add label if exists
      if (edgeData.label) {
        const labelElement = this.createEdgeLabel(edgeData, path);
        edgeGroup.appendChild(labelElement);
      }

      // Add to edge layer
      this.addEdgeElement(edgeId, edgeGroup);

      this.log.info("renderEdge", `✓ Edge '${edgeId}' rendered successfully`);
      this.log.exit("renderEdge");

      return edgeGroup;
    } catch (error) {
      this.log.error("renderEdge", `Failed to render edge ${edgeId}`, error);
      this.log.exit("renderEdge");
      return null;
    }
  }

  /**
   * Calculate edge path
   */
  calculateEdgePath(edgeData) {
    const { sourceX, sourceY, targetX, targetY } = edgeData;

    // Simple straight line for now
    // TODO: Implement bezier curves and orthogonal routing
    return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
  }

  /**
   * Create edge label
   */
  createEdgeLabel(edgeData, path) {
    const { sourceX, sourceY, targetX, targetY } = edgeData;

    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", midX);
    text.setAttribute("y", midY - 5);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "#424242");
    text.setAttribute("font-size", "12");
    text.setAttribute("class", "edge-label");
    text.textContent = edgeData.label;

    return text;
  }

  /**
   * Update viewport transform
   */
  updateTransform() {
    this.log.enter("updateTransform", this.viewport);

    const transform = `translate(${this.viewport.x}, ${this.viewport.y}) scale(${this.viewport.zoom})`;
    this.viewportGroup.setAttribute("transform", transform);

    this.log.info("updateTransform", `Applied transform: ${transform}`);
    this.log.exit("updateTransform");
  }

  /**
   * Render grid pattern
   */
  renderGrid() {
    this.log.enter("renderGrid");

    if (!this.grid.enabled || !this.grid.visible) {
      this.gridLayer.innerHTML = "";
      this.log.info("renderGrid", "Grid disabled or hidden");
      this.log.exit("renderGrid");
      return;
    }

    this.log.info("renderGrid", `Creating grid with size ${this.grid.size}`);

    // Clear existing grid
    this.gridLayer.innerHTML = "";

    const size = this.grid.size;
    const width = this.canvasSize.width;
    const height = this.canvasSize.height;

    // Create pattern in defs
    const patternId = "grid-pattern";
    let pattern = this.defsLayer.querySelector(`#${patternId}`);

    if (!pattern) {
      pattern = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "pattern"
      );
      pattern.setAttribute("id", patternId);
      pattern.setAttribute("patternUnits", "userSpaceOnUse");
      this.defsLayer.appendChild(pattern);
    }

    pattern.setAttribute("width", size);
    pattern.setAttribute("height", size);

    // Clear pattern
    pattern.innerHTML = "";

    // Add grid lines to pattern
    const line1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    line1.setAttribute("x1", 0);
    line1.setAttribute("y1", 0);
    line1.setAttribute("x2", size);
    line1.setAttribute("y2", 0);
    line1.setAttribute("stroke", "var(--canvas-grid)");
    line1.setAttribute("stroke-width", "1");
    pattern.appendChild(line1);

    const line2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    line2.setAttribute("x1", 0);
    line2.setAttribute("y1", 0);
    line2.setAttribute("x2", 0);
    line2.setAttribute("y2", size);
    line2.setAttribute("stroke", "var(--canvas-grid)");
    line2.setAttribute("stroke-width", "1");
    pattern.appendChild(line2);

    // Create rectangle with pattern
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", -width / 2);
    rect.setAttribute("y", -height / 2);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", `url(#${patternId})`);
    rect.setAttribute("pointer-events", "none");
    this.gridLayer.appendChild(rect);

    this.log.info("renderGrid", "✓ Grid rendered");
    this.log.exit("renderGrid");
  }

  /**
   * Add node element to canvas
   */
  addNodeElement(nodeId, element) {
    this.log.enter("addNodeElement", { nodeId });

    element.setAttribute("data-node-id", nodeId);
    this.nodeLayer.appendChild(element);

    this.log.info("addNodeElement", `✓ Node '${nodeId}' added to canvas`);
    this.log.exit("addNodeElement");
  }

  /**
   * Remove node element from canvas
   */
  removeNodeElement(nodeId) {
    this.log.enter("removeNodeElement", { nodeId });

    const element = this.nodeLayer.querySelector(`[data-node-id="${nodeId}"]`);
    if (element) {
      element.remove();
      this.log.info(
        "removeNodeElement",
        `✓ Node '${nodeId}' removed from canvas`
      );
    } else {
      this.log.warn(
        "removeNodeElement",
        `Node '${nodeId}' not found in canvas`
      );
    }

    this.log.exit("removeNodeElement");
  }

  /**
   * Add edge element to canvas
   */
  addEdgeElement(edgeId, element) {
    this.log.enter("addEdgeElement", { edgeId });

    element.setAttribute("data-edge-id", edgeId);
    this.edgeLayer.appendChild(element);

    this.log.info("addEdgeElement", `✓ Edge '${edgeId}' added to canvas`);
    this.log.exit("addEdgeElement");
  }

  /**
   * Remove edge element from canvas
   */
  removeEdgeElement(edgeId) {
    this.log.enter("removeEdgeElement", { edgeId });

    const element = this.edgeLayer.querySelector(`[data-edge-id="${edgeId}"]`);
    if (element) {
      element.remove();
      this.log.info(
        "removeEdgeElement",
        `✓ Edge '${edgeId}' removed from canvas`
      );
    } else {
      this.log.warn(
        "removeEdgeElement",
        `Edge '${edgeId}' not found in canvas`
      );
    }

    this.log.exit("removeEdgeElement");
  }

  /**
   * Convert screen coordinates to canvas coordinates
   */
  screenToCanvas(screenX, screenY) {
    this.log.enter("screenToCanvas", { screenX, screenY });

    const rect = this.svg.getBoundingClientRect();
    const x = (screenX - rect.left - this.viewport.x) / this.viewport.zoom;
    const y = (screenY - rect.top - this.viewport.y) / this.viewport.zoom;

    this.log.info("screenToCanvas", `Converted to canvas: (${x}, ${y})`);
    this.log.exit("screenToCanvas");

    return { x, y };
  }

  /**
   * Convert canvas coordinates to screen coordinates
   */
  canvasToScreen(canvasX, canvasY) {
    this.log.enter("canvasToScreen", { canvasX, canvasY });

    const rect = this.svg.getBoundingClientRect();
    const x = canvasX * this.viewport.zoom + this.viewport.x + rect.left;
    const y = canvasY * this.viewport.zoom + this.viewport.y + rect.top;

    this.log.info("canvasToScreen", `Converted to screen: (${x}, ${y})`);
    this.log.exit("canvasToScreen");

    return { x, y };
  }

  /**
   * Set viewport (zoom and pan)
   */
  setViewport(viewport) {
    this.log.enter("setViewport", viewport);

    if (viewport.x !== undefined) this.viewport.x = viewport.x;
    if (viewport.y !== undefined) this.viewport.y = viewport.y;
    if (viewport.zoom !== undefined) {
      this.viewport.zoom = Math.max(
        this.viewport.minZoom,
        Math.min(this.viewport.maxZoom, viewport.zoom)
      );
    }

    this.updateTransform();
    this.eventBus.emit("viewport:changed", { ...this.viewport });

    this.log.info("setViewport", "✓ Viewport updated");
    this.log.exit("setViewport");
  }

  /**
   * Get current viewport
   */
  getViewport() {
    return { ...this.viewport };
  }

  /**
   * Zoom to fit all content
   */
  fitToView(padding = 50) {
    this.log.enter("fitToView", { padding });

    // Get bounding box of all content
    const bbox = this.getContentBounds();
    if (!bbox) {
      this.log.warn("fitToView", "No content to fit");
      this.log.exit("fitToView");
      return;
    }

    const rect = this.svg.getBoundingClientRect();
    const availableWidth = rect.width - padding * 2;
    const availableHeight = rect.height - padding * 2;

    // Calculate zoom to fit
    const zoomX = availableWidth / bbox.width;
    const zoomY = availableHeight / bbox.height;
    const zoom = Math.min(zoomX, zoomY, this.viewport.maxZoom);

    // Calculate center position
    const x = (rect.width - bbox.width * zoom) / 2 - bbox.x * zoom;
    const y = (rect.height - bbox.height * zoom) / 2 - bbox.y * zoom;

    this.setViewport({ x, y, zoom });

    this.log.info("fitToView", `✓ Fitted to view with zoom ${zoom.toFixed(2)}`);
    this.log.exit("fitToView");
  }

  /**
   * Get bounding box of all content
   */
  getContentBounds() {
    this.log.enter("getContentBounds");

    const nodes = this.nodeLayer.children;
    if (nodes.length === 0) {
      this.log.info("getContentBounds", "No nodes found");
      this.log.exit("getContentBounds");
      return null;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      const bbox = node.getBBox();
      minX = Math.min(minX, bbox.x);
      minY = Math.min(minY, bbox.y);
      maxX = Math.max(maxX, bbox.x + bbox.width);
      maxY = Math.max(maxY, bbox.y + bbox.height);
    }

    const bounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    this.log.info("getContentBounds", bounds);
    this.log.exit("getContentBounds");

    return bounds;
  }

  /**
   * Set grid settings
   */
  setGrid(enabled, size, visible) {
    this.log.enter("setGrid", { enabled, size, visible });

    if (enabled !== undefined) this.grid.enabled = enabled;
    if (size !== undefined) this.grid.size = size;
    if (visible !== undefined) this.grid.visible = visible;

    this.renderGrid();

    this.log.info("setGrid", "✓ Grid settings updated");
    this.log.exit("setGrid");
  }

  /**
   * Get SVG element
   */
  getSVG() {
    return this.svg;
  }

  /**
   * Get node layer
   */
  getNodeLayer() {
    return this.nodeLayer;
  }

  /**
   * Get edge layer
   */
  getEdgeLayer() {
    return this.edgeLayer;
  }

  /**
   * Get overlay layer
   */
  getOverlayLayer() {
    return this.overlayLayer;
  }

  /**
   * Export as SVG string
   */
  exportSVG() {
    this.log.enter("exportSVG");

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(this.svg);

    this.log.info(
      "exportSVG",
      `✓ Exported SVG (${svgString.length} characters)`
    );
    this.log.exit("exportSVG");

    return svgString;
  }

  /**
   * Export as image (PNG/JPG)
   */
  async exportImage(format = "png") {
    this.log.enter("exportImage", { format });

    return new Promise((resolve, reject) => {
      try {
        const svgString = this.exportSVG();
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = this.svg.clientWidth;
          canvas.height = this.svg.clientHeight;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          canvas.toBlob((blob) => {
            const imageUrl = URL.createObjectURL(blob);
            URL.revokeObjectURL(url);

            this.log.info("exportImage", `✓ Exported as ${format}`);
            this.log.exit("exportImage");

            resolve(imageUrl);
          }, `image/${format}`);
        };

        img.onerror = (error) => {
          this.log.error("exportImage", "Failed to export image", error);
          this.log.exit("exportImage");
          reject(error);
        };

        img.src = url;
      } catch (error) {
        this.log.error("exportImage", "Failed to export image", error);
        this.log.exit("exportImage");
        reject(error);
      }
    });
  }

  /**
   * Clear canvas (remove all nodes and edges)
   */
  clear() {
    this.log.enter("clear");

    this.nodeLayer.innerHTML = "";
    this.edgeLayer.innerHTML = "";
    this.overlayLayer.innerHTML = "";

    this.log.info("clear", "✓ Canvas cleared");
    this.log.exit("clear");
  }

  /**
   * Create arrow marker for edges
   */
  createArrowMarker() {
    this.log.enter("createArrowMarker");

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

    this.log.info("createArrowMarker", "✓ Arrow marker created");
    this.log.exit("createArrowMarker");
  }

  /**
   * Destroy editor and cleanup
   */
  destroy() {
    this.log.enter("destroy");

    // Remove event listeners
    this.svg.removeEventListener("wheel", this.handleWheel);
    this.svg.removeEventListener("mousedown", this.handleMouseDown);
    this.svg.removeEventListener("mousemove", this.handleMouseMove);
    this.svg.removeEventListener("mouseup", this.handleMouseUp);
    this.svg.removeEventListener("mouseleave", this.handleMouseLeave);
    this.svg.removeEventListener("click", this.handleClick);
    this.svg.removeEventListener("contextmenu", this.handleContextMenu);
    this.svg.removeEventListener("dragover", this.handleDragOver);
    this.svg.removeEventListener("drop", this.handleDrop);

    // Remove SVG from DOM
    if (this.svg && this.svg.parentNode) {
      this.svg.parentNode.removeChild(this.svg);
    }

    this.log.info("destroy", "✓ Editor destroyed");
    this.log.exit("destroy");
  }
}
