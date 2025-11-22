/**
 * NodeView.js - Visual representation of a node
 *
 * Responsibilities:
 * - Create complete SVG visualization of a node
 * - Use shape.render() to get shape geometry
 * - Add label, ports, resize handles
 * - Update visual when model changes
 * - NO interaction logic (that's NodeController's job)
 */

import { DebugLogger } from "../../utils/debug/DebugLogger.js";

export class NodeView {
  constructor(model, shapeDefinition) {
    this.log = DebugLogger.for(this);
    this.log.enter("constructor", { nodeId: model.id, type: model.type });

    this.model = model;
    this.shapeDefinition = shapeDefinition;

    // Create the root SVG group
    this.element = this.createNodeGroup();

    this.log.exit("constructor");
  }

  /**
   * Create the complete node SVG group
   */
  createNodeGroup() {
    this.log.enter("createNodeGroup");

    // Create root <g> element
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "node");
    group.setAttribute("data-node-id", this.model.id);
    group.setAttribute(
      "transform",
      `translate(${this.model.x}, ${this.model.y})`
    );

    // 1. Create shape element (using shape class)
    const shapeElement = this.createShapeElement();
    if (shapeElement) {
      group.appendChild(shapeElement);
    }

    // 2. Create label
    const labelElement = this.createLabelElement();
    if (labelElement) {
      group.appendChild(labelElement);
    }

    // 3. Create ports group
    const portsGroup = this.createPortsGroup();
    if (portsGroup) {
      portsGroup.style.display = "none"; // Hidden by default, shown on hover
      group.appendChild(portsGroup);
    }

    // 4. Create resize handles group
    const handlesGroup = this.createHandlesGroup();
    if (handlesGroup) {
      handlesGroup.style.display = "none"; // Hidden by default, shown on selection
      group.appendChild(handlesGroup);
    }

    this.log.exit("createNodeGroup");
    return group;
  }

  /**
   * Create shape element using the shape's render() method
   */
  createShapeElement() {
    this.log.enter("createShapeElement");

    // Get the shape class from definition
    const ShapeClass = this.shapeDefinition.shapeClass;

    if (!ShapeClass || !ShapeClass.render) {
      this.log.error(
        "createShapeElement",
        "Shape class or render method not found"
      );
      return this.createFallbackShape();
    }

    // Call the shape's static render method
    const shapeElement = ShapeClass.render(
      this.model.width,
      this.model.height,
      this.model.style
    );

    shapeElement.setAttribute("class", "node-shape");
    shapeElement.style.cursor = "move";

    this.log.exit("createShapeElement");
    return shapeElement;
  }

  /**
   * Fallback shape if shape class fails
   */
  createFallbackShape() {
    this.log.warn("createFallbackShape", "Using fallback rectangle");

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", this.model.width);
    rect.setAttribute("height", this.model.height);
    rect.setAttribute("fill", this.model.style.fill || "#ffffff");
    rect.setAttribute("stroke", this.model.style.stroke || "#424242");
    rect.setAttribute("stroke-width", this.model.style.strokeWidth || 2);
    rect.setAttribute("rx", 4);
    rect.setAttribute("class", "node-shape");
    rect.style.cursor = "move";

    return rect;
  }

  /**
   * Create label text element
   */
  createLabelElement() {
    this.log.enter("createLabelElement");

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", this.model.width / 2);
    text.setAttribute("y", this.model.height / 2);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("class", "node-label");
    text.setAttribute("fill", this.model.style.color || "#000000");
    text.setAttribute("font-size", this.model.style.fontSize || "14");
    text.setAttribute("font-family", "Arial, sans-serif");
    text.style.pointerEvents = "none"; // Don't block shape interactions
    text.textContent = this.model.label;

    this.log.exit("createLabelElement");
    return text;
  }

  /**
   * Create ports group based on shape definition
   */
  createPortsGroup() {
    this.log.enter("createPortsGroup");

    const portsGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    portsGroup.setAttribute("class", "ports-group");

    // Get ports from shape definition or use defaults
    const ports = this.shapeDefinition.defaultPorts || this.getDefaultPorts();

    ports.forEach((portDef) => {
      const port = this.createPortElement(portDef);
      portsGroup.appendChild(port);
    });

    this.log.exit("createPortsGroup");
    return portsGroup;
  }

  /**
   * Get default ports if shape doesn't define them
   */
  getDefaultPorts() {
    const w = this.model.width;
    const h = this.model.height;

    return [
      { id: "top", x: w / 2, y: 0, position: "top" },
      { id: "right", x: w, y: h / 2, position: "right" },
      { id: "bottom", x: w / 2, y: h, position: "bottom" },
      { id: "left", x: 0, y: h / 2, position: "left" },
    ];
  }

  /**
   * Create individual port element
   */
  createPortElement(portDef) {
    const port = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    port.setAttribute("class", "port");
    port.setAttribute("data-port-id", portDef.id);
    port.setAttribute("data-port-position", portDef.position);
    port.setAttribute("data-node-id", this.model.id);
    port.setAttribute("cx", portDef.x);
    port.setAttribute("cy", portDef.y);
    port.setAttribute("r", 6);
    port.setAttribute("fill", "#2196F3");
    port.setAttribute("stroke", "#ffffff");
    port.setAttribute("stroke-width", 2);
    port.style.cursor = "crosshair";

    return port;
  }

  /**
   * Create resize handles group
   */
  createHandlesGroup() {
    this.log.enter("createHandlesGroup");

    const handlesGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    handlesGroup.setAttribute("class", "handles-group");

    const w = this.model.width;
    const h = this.model.height;

    const handles = [
      { id: "nw", x: 0, y: 0, cursor: "nw-resize" },
      { id: "n", x: w / 2, y: 0, cursor: "n-resize" },
      { id: "ne", x: w, y: 0, cursor: "ne-resize" },
      { id: "e", x: w, y: h / 2, cursor: "e-resize" },
      { id: "se", x: w, y: h, cursor: "se-resize" },
      { id: "s", x: w / 2, y: h, cursor: "s-resize" },
      { id: "sw", x: 0, y: h, cursor: "sw-resize" },
      { id: "w", x: 0, y: h / 2, cursor: "w-resize" },
    ];

    handles.forEach((handleDef) => {
      const handle = this.createHandleElement(handleDef);
      handlesGroup.appendChild(handle);
    });

    this.log.exit("createHandlesGroup");
    return handlesGroup;
  }

  /**
   * Create individual resize handle element
   */
  createHandleElement(handleDef) {
    const handle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    handle.setAttribute("class", "resize-handle");
    handle.setAttribute("data-handle-id", handleDef.id);
    handle.setAttribute("data-node-id", this.model.id);
    handle.setAttribute("x", handleDef.x - 4);
    handle.setAttribute("y", handleDef.y - 4);
    handle.setAttribute("width", 8);
    handle.setAttribute("height", 8);
    handle.setAttribute("fill", "#ffffff");
    handle.setAttribute("stroke", "#2196F3");
    handle.setAttribute("stroke-width", 2);
    handle.style.cursor = handleDef.cursor;

    return handle;
  }

  /**
   * Update view when model changes
   */
  update() {
    this.log.enter("update");

    // Update transform (position)
    this.element.setAttribute(
      "transform",
      `translate(${this.model.x}, ${this.model.y})`
    );

    // Update shape
    const shapeElement = this.element.querySelector(".node-shape");
    if (shapeElement) {
      shapeElement.setAttribute("width", this.model.width);
      shapeElement.setAttribute("height", this.model.height);

      if (this.model.style.fill) {
        shapeElement.setAttribute("fill", this.model.style.fill);
      }
      if (this.model.style.stroke) {
        shapeElement.setAttribute("stroke", this.model.style.stroke);
      }
    }

    // Update label
    const labelElement = this.element.querySelector(".node-label");
    if (labelElement) {
      labelElement.setAttribute("x", this.model.width / 2);
      labelElement.setAttribute("y", this.model.height / 2);
      labelElement.textContent = this.model.label;
    }

    // Update ports positions
    const ports = this.getDefaultPorts();
    const portElements = this.element.querySelectorAll(".port");
    portElements.forEach((portEl, index) => {
      if (ports[index]) {
        portEl.setAttribute("cx", ports[index].x);
        portEl.setAttribute("cy", ports[index].y);
      }
    });

    // Update handles positions
    const w = this.model.width;
    const h = this.model.height;
    const handlePositions = {
      nw: { x: 0, y: 0 },
      n: { x: w / 2, y: 0 },
      ne: { x: w, y: 0 },
      e: { x: w, y: h / 2 },
      se: { x: w, y: h },
      s: { x: w / 2, y: h },
      sw: { x: 0, y: h },
      w: { x: 0, y: h / 2 },
    };

    const handleElements = this.element.querySelectorAll(".resize-handle");
    handleElements.forEach((handleEl) => {
      const handleId = handleEl.getAttribute("data-handle-id");
      const pos = handlePositions[handleId];
      if (pos) {
        handleEl.setAttribute("x", pos.x - 4);
        handleEl.setAttribute("y", pos.y - 4);
      }
    });

    this.log.exit("update");
  }

  /**
   * Show ports
   */
  showPorts() {
    const portsGroup = this.element.querySelector(".ports-group");
    if (portsGroup) {
      portsGroup.style.display = "block";
    }
  }

  /**
   * Hide ports
   */
  hidePorts() {
    const portsGroup = this.element.querySelector(".ports-group");
    if (portsGroup) {
      portsGroup.style.display = "none";
    }
  }

  /**
   * Show resize handles
   */
  showHandles() {
    const handlesGroup = this.element.querySelector(".handles-group");
    if (handlesGroup) {
      handlesGroup.style.display = "block";
    }
  }

  /**
   * Hide resize handles
   */
  hideHandles() {
    const handlesGroup = this.element.querySelector(".handles-group");
    if (handlesGroup) {
      handlesGroup.style.display = "none";
    }
  }

  /**
   * Destroy view and clean up
   */
  destroy() {
    this.log.enter("destroy");

    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    this.element = null;
    this.model = null;
    this.shapeDefinition = null;

    this.log.exit("destroy");
  }
}
