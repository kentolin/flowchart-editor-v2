/**
 * NodeController.js - Handles all node interactions
 *
 * Responsibilities:
 * - Attach event listeners to node view
 * - Handle drag & drop
 * - Handle resize
 * - Handle selection
 * - Handle port clicks
 * - Emit events via EventBus
 * - Update model based on interactions
 */

import { DebugLogger } from "../../utils/debug/DebugLogger.js";

export class NodeController {
  constructor(model, view, eventBus) {
    this.log = DebugLogger.for(this);
    this.log.enter("constructor", { nodeId: model.id });

    this.model = model;
    this.view = view;
    this.eventBus = eventBus;

    // Interaction state
    this.isDragging = false;
    this.isResizing = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.nodeStartX = 0;
    this.nodeStartY = 0;
    this.resizeStartWidth = 0;
    this.resizeStartHeight = 0;
    this.resizeStartX = 0;
    this.resizeStartY = 0;
    this.resizeHandle = null;

    // Bind handlers
    this.setupEventHandlers();

    this.log.exit("constructor");
  }

  /**
   * Setup all event handlers
   */
  setupEventHandlers() {
    this.log.enter("setupEventHandlers");

    // Get elements
    const shapeElement = this.view.element.querySelector(".node-shape");
    const ports = this.view.element.querySelectorAll(".port");
    const handles = this.view.element.querySelectorAll(".resize-handle");

    // Shape drag handlers
    if (shapeElement) {
      shapeElement.addEventListener("mousedown", (e) =>
        this.handleDragStart(e)
      );
    }

    // Port click handlers
    ports.forEach((port) => {
      port.addEventListener("mousedown", (e) => this.handlePortMouseDown(e));
    });

    // Resize handle handlers
    handles.forEach((handle) => {
      handle.addEventListener("mousedown", (e) => this.handleResizeStart(e));
    });

    // Hover handlers (show/hide ports)
    this.view.element.addEventListener("mouseenter", () =>
      this.handleMouseEnter()
    );
    this.view.element.addEventListener("mouseleave", () =>
      this.handleMouseLeave()
    );

    // Click handler (selection)
    this.view.element.addEventListener("click", (e) => this.handleClick(e));

    // Double-click handler (edit label)
    this.view.element.addEventListener("dblclick", (e) =>
      this.handleDoubleClick(e)
    );

    this.log.exit("setupEventHandlers");
  }

  /**
   * Handle drag start
   */
  handleDragStart(e) {
    if (e.button !== 0) return; // Only left mouse button

    this.log.enter("handleDragStart");

    e.stopPropagation();

    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.nodeStartX = this.model.x;
    this.nodeStartY = this.model.y;

    // Attach document-level handlers
    this.boundDragMove = (e) => this.handleDragMove(e);
    this.boundDragEnd = (e) => this.handleDragEnd(e);

    document.addEventListener("mousemove", this.boundDragMove);
    document.addEventListener("mouseup", this.boundDragEnd);

    this.log.exit("handleDragStart");
  }

  /**
   * Handle drag move
   */
  handleDragMove(e) {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.dragStartX;
    const deltaY = e.clientY - this.dragStartY;

    const newX = this.nodeStartX + deltaX;
    const newY = this.nodeStartY + deltaY;

    // Update model
    this.model.setPosition(newX, newY);

    // Update view transform
    this.view.element.setAttribute("transform", `translate(${newX}, ${newY})`);

    // Emit dragging event
    this.eventBus.emit("node:dragging", {
      nodeId: this.model.id,
      x: newX,
      y: newY,
    });
  }

  /**
   * Handle drag end
   */
  handleDragEnd(e) {
    if (!this.isDragging) return;

    this.log.enter("handleDragEnd");

    this.isDragging = false;

    // Remove document-level handlers
    document.removeEventListener("mousemove", this.boundDragMove);
    document.removeEventListener("mouseup", this.boundDragEnd);

    // Emit final moved event
    this.eventBus.emit("node:moved", {
      nodeId: this.model.id,
      x: this.model.x,
      y: this.model.y,
    });

    this.log.info(
      "handleDragEnd",
      `Node moved to (${this.model.x}, ${this.model.y})`
    );
    this.log.exit("handleDragEnd");
  }

  /**
   * Handle resize start
   */
  handleResizeStart(e) {
    this.log.enter("handleResizeStart");

    e.stopPropagation();
    e.preventDefault();

    this.isResizing = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.nodeStartX = this.model.x;
    this.nodeStartY = this.model.y;
    this.resizeStartWidth = this.model.width;
    this.resizeStartHeight = this.model.height;

    const handleId = e.target.getAttribute("data-handle-id");
    this.resizeHandle = handleId;

    // Attach document-level handlers
    this.boundResizeMove = (e) => this.handleResizeMove(e);
    this.boundResizeEnd = (e) => this.handleResizeEnd(e);

    document.addEventListener("mousemove", this.boundResizeMove);
    document.addEventListener("mouseup", this.boundResizeEnd);

    // Emit resize start event
    this.eventBus.emit("node:resizestart", {
      nodeId: this.model.id,
      handleId: handleId,
      clientX: e.clientX,
      clientY: e.clientY,
    });

    this.log.exit("handleResizeStart");
  }

  /**
   * Handle resize move
   */
  handleResizeMove(e) {
    if (!this.isResizing) return;

    const deltaX = e.clientX - this.dragStartX;
    const deltaY = e.clientY - this.dragStartY;

    let newWidth = this.resizeStartWidth;
    let newHeight = this.resizeStartHeight;
    let newX = this.nodeStartX;
    let newY = this.nodeStartY;

    const minWidth = 60;
    const minHeight = 30;

    // Handle different resize directions
    switch (this.resizeHandle) {
      case "nw":
        newWidth = Math.max(minWidth, this.resizeStartWidth - deltaX);
        newHeight = Math.max(minHeight, this.resizeStartHeight - deltaY);
        newX = this.nodeStartX + (this.resizeStartWidth - newWidth);
        newY = this.nodeStartY + (this.resizeStartHeight - newHeight);
        break;
      case "n":
        newHeight = Math.max(minHeight, this.resizeStartHeight - deltaY);
        newY = this.nodeStartY + (this.resizeStartHeight - newHeight);
        break;
      case "ne":
        newWidth = Math.max(minWidth, this.resizeStartWidth + deltaX);
        newHeight = Math.max(minHeight, this.resizeStartHeight - deltaY);
        newY = this.nodeStartY + (this.resizeStartHeight - newHeight);
        break;
      case "e":
        newWidth = Math.max(minWidth, this.resizeStartWidth + deltaX);
        break;
      case "se":
        newWidth = Math.max(minWidth, this.resizeStartWidth + deltaX);
        newHeight = Math.max(minHeight, this.resizeStartHeight + deltaY);
        break;
      case "s":
        newHeight = Math.max(minHeight, this.resizeStartHeight + deltaY);
        break;
      case "sw":
        newWidth = Math.max(minWidth, this.resizeStartWidth - deltaX);
        newHeight = Math.max(minHeight, this.resizeStartHeight + deltaY);
        newX = this.nodeStartX + (this.resizeStartWidth - newWidth);
        break;
      case "w":
        newWidth = Math.max(minWidth, this.resizeStartWidth - deltaX);
        newX = this.nodeStartX + (this.resizeStartWidth - newWidth);
        break;
    }

    // Update model
    this.model.setPosition(newX, newY);
    this.model.setSize(newWidth, newHeight);

    // Update view
    this.view.update();

    // Emit resizing event
    this.eventBus.emit("node:resizing", {
      nodeId: this.model.id,
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });
  }

  /**
   * Handle resize end
   */
  handleResizeEnd(e) {
    if (!this.isResizing) return;

    this.log.enter("handleResizeEnd");

    this.isResizing = false;
    this.resizeHandle = null;

    // Remove document-level handlers
    document.removeEventListener("mousemove", this.boundResizeMove);
    document.removeEventListener("mouseup", this.boundResizeEnd);

    // Emit final resize event
    this.eventBus.emit("node:resized", {
      nodeId: this.model.id,
      x: this.model.x,
      y: this.model.y,
      width: this.model.width,
      height: this.model.height,
    });

    this.log.info(
      "handleResizeEnd",
      `Node resized to ${this.model.width}x${this.model.height}`
    );
    this.log.exit("handleResizeEnd");
  }

  /**
   * Handle port mouse down
   */
  handlePortMouseDown(e) {
    this.log.enter("handlePortMouseDown");

    e.stopPropagation();
    e.preventDefault();

    const portId = e.target.getAttribute("data-port-id");
    const portPosition = e.target.getAttribute("data-port-position");

    this.log.info("handlePortMouseDown", `Port ${portId} clicked`);

    // Emit port mousedown event
    this.eventBus.emit("port:mousedown", {
      nodeId: this.model.id,
      portId: portId,
      portPosition: portPosition,
      clientX: e.clientX,
      clientY: e.clientY,
    });

    this.log.exit("handlePortMouseDown");
  }

  /**
   * Handle mouse enter (show ports)
   */
  handleMouseEnter() {
    this.view.showPorts();
  }

  /**
   * Handle mouse leave (hide ports)
   */
  handleMouseLeave() {
    this.view.hidePorts();
  }

  /**
   * Handle click (selection)
   */
  handleClick(e) {
    // Don't trigger if we just finished dragging
    if (
      Math.abs(e.clientX - this.dragStartX) > 5 ||
      Math.abs(e.clientY - this.dragStartY) > 5
    ) {
      return;
    }

    e.stopPropagation();

    this.log.info("handleClick", `Node ${this.model.id} clicked`);

    // Emit selection event
    this.eventBus.emit("node:selected", {
      nodeId: this.model.id,
      nodeData: this.model.toJSON(),
    });
  }

  /**
   * Handle double-click (edit)
   */
  handleDoubleClick(e) {
    e.stopPropagation();

    this.log.info("handleDoubleClick", `Node ${this.model.id} double-clicked`);

    // Emit edit event
    this.eventBus.emit("node:edit", {
      nodeId: this.model.id,
      nodeData: this.model.toJSON(),
    });
  }

  /**
   * Destroy controller and remove event listeners
   */
  destroy() {
    this.log.enter("destroy");

    // Remove document-level listeners if still attached
    if (this.boundDragMove) {
      document.removeEventListener("mousemove", this.boundDragMove);
    }
    if (this.boundDragEnd) {
      document.removeEventListener("mouseup", this.boundDragEnd);
    }
    if (this.boundResizeMove) {
      document.removeEventListener("mousemove", this.boundResizeMove);
    }
    if (this.boundResizeEnd) {
      document.removeEventListener("mouseup", this.boundResizeEnd);
    }

    this.model = null;
    this.view = null;
    this.eventBus = null;

    this.log.exit("destroy");
  }
}
