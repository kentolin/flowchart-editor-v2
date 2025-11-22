/**
 * NodeView.js - Node Visual Rendering & Representation
 *
 * Handles SVG rendering, visual styling, and DOM manipulation for node entities.
 * Manages the visual representation of nodes on the canvas including shapes,
 * labels, selection states, and interactive feedback.
 *
 * DEPENDENCIES: ShapeBuilder
 *
 * @module src/views/NodeView
 * @version 1.0.0
 *
 * Purpose:
 * - Create SVG visual representation of nodes
 * - Apply styling and theming
 * - Handle selection and hover states
 * - Update node visuals when data changes
 * - Manage node layout and positioning
 * - Provide animation support
 * - Handle visual feedback for interactions
 *
 * Responsibilities:
 * - Render node SVG elements
 * - Apply node styling (fill, stroke, opacity)
 * - Update visual state (selected, hovered, disabled)
 * - Position and transform nodes
 * - Manage node labels and text
 * - Handle resize/boundary visualization
 * - Render node decorations (ports, handles, badges)
 * - Clean up DOM elements
 *
 * Architecture:
 * - Group wrapper (g element) contains all node visuals
 * - Shape element (created by ShapeBuilder)
 * - Label/text element
 * - Selection box (shown when selected)
 * - Handles (for resizing)
 * - Ports (connection points)
 * - Badges (metadata indicators)
 *
 * @example
 * const nodeView = new NodeView(shapeBuilder);
 *
 * // Create node visual
 * const svgElement = nodeView.render({
 *   id: 'node-1',
 *   shapeType: 'rectangle',
 *   x: 100,
 *   y: 100,
 *   width: 120,
 *   height: 80,
 *   label: 'Process A',
 *   fill: '#ff0000'
 * });
 *
 * canvas.appendChild(svgElement);
 *
 * // Update visual state
 * nodeView.setSelected(svgElement, true);
 * nodeView.setHovered(svgElement, true);
 *
 * // Update node data
 * nodeView.update(svgElement, {
 *   label: 'Updated Label',
 *   fill: '#00ff00'
 * });
 */

/**
 * NodeView Class
 *
 * Handles visual rendering and representation of nodes.
 */
class NodeView {
  /**
   * Initialize the node view
   *
   * @param {ShapeBuilder} shapeBuilder - Shape builder for creating shapes
   *
   * @throws {Error} If shapeBuilder is not valid
   *
   * @example
   * const view = new NodeView(shapeBuilder);
   */
  constructor(shapeBuilder) {
    // Validate shapeBuilder
    if (!shapeBuilder || typeof shapeBuilder.build !== "function") {
      throw new Error(
        "NodeView: Constructor requires valid ShapeBuilder instance"
      );
    }

    // Store builder
    this.shapeBuilder = shapeBuilder;

    // SVG namespace
    this.SVG_NS = "http://www.w3.org/2000/svg";

    // Configuration
    this.config = {
      selectionBoxPadding: 4,
      selectionBoxStroke: "#0066cc",
      selectionBoxDasharray: "5,5",
      hoverOpacity: 0.8,
      disabledOpacity: 0.5,
      handleSize: 6,
      handleStroke: "#0066cc",
      portRadius: 4,
      portStroke: "#666666",
      badgeSize: 16,
      animationDuration: 200,
    };

    // CSS classes for styling
    this.classes = {
      node: "node",
      nodeGroup: "node-group",
      nodeShape: "node-shape",
      nodeLabel: "node-label",
      nodeSelected: "node-selected",
      nodeHovered: "node-hovered",
      nodeDisabled: "node-disabled",
      selectionBox: "node-selection-box",
      handle: "node-handle",
      port: "node-port",
      badge: "node-badge",
    };
  }

  /**
   * Render a node
   *
   * Creates SVG element representing the node with all visual components.
   *
   * @param {Object} nodeData - Node data
   * @param {string} nodeData.id - Node ID
   * @param {string} nodeData.shapeType - Shape type
   * @param {number} nodeData.x - X position
   * @param {number} nodeData.y - Y position
   * @param {number} nodeData.width - Width
   * @param {number} nodeData.height - Height
   * @param {string} [nodeData.label] - Node label
   * @param {string} [nodeData.fill] - Fill color
   * @param {string} [nodeData.stroke] - Stroke color
   * @param {number} [nodeData.strokeWidth] - Stroke width
   * @param {Object} [options] - Render options
   * @param {boolean} [options.showHandles] - Show resize handles?
   * @param {boolean} [options.showPorts] - Show connection ports?
   * @param {Array} [options.ports] - Port definitions
   *
   * @returns {SVGElement} Rendered node group element
   *
   * @throws {Error} If node data is invalid
   *
   * @example
   * const nodeElement = nodeView.render({
   *   id: 'node-1',
   *   shapeType: 'rectangle',
   *   x: 100,
   *   y: 100,
   *   width: 120,
   *   height: 80,
   *   label: 'Process'
   * }, { showHandles: true });
   */
  render(nodeData, options = {}) {
    // Validate node data
    this._validateNodeData(nodeData);

    // Create main group
    const group = document.createElementNS(this.SVG_NS, "g");
    group.classList.add(this.classes.nodeGroup);
    group.setAttribute("data-node-id", nodeData.id);
    group.setAttribute("transform", `translate(${nodeData.x}, ${nodeData.y})`);

    // Create shape
    const shapeElement = this._renderShape(nodeData);
    group.appendChild(shapeElement);

    // Create label if provided
    if (nodeData.label) {
      const labelElement = this._renderLabel(nodeData);
      group.appendChild(labelElement);
    }

    // Render handles if requested
    if (options.showHandles) {
      this._renderHandles(group, nodeData);
    }

    // Render ports if requested
    if (options.showPorts && options.ports) {
      this._renderPorts(group, nodeData, options.ports);
    }

    // Store node data on element for later access
    group._nodeData = nodeData;

    return group;
  }

  /**
   * Render shape element
   *
   * @private
   */
  _renderShape(nodeData) {
    const shapeElement = this.shapeBuilder
      .reset()
      .custom(nodeData.shapeType)
      .at(0, 0)
      .size(nodeData.width, nodeData.height)
      .fill(nodeData.fill || "#ffffff")
      .stroke(nodeData.stroke || "#000000", nodeData.strokeWidth || 2)
      .class(this.classes.nodeShape)
      .build();

    return shapeElement;
  }

  /**
   * Render node label
   *
   * @private
   */
  _renderLabel(nodeData) {
    const text = document.createElementNS(this.SVG_NS, "text");

    text.setAttribute("x", nodeData.width / 2);
    text.setAttribute("y", nodeData.height / 2);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("font-family", "Arial, sans-serif");
    text.setAttribute("font-size", "12");
    text.setAttribute("fill", "#333333");
    text.setAttribute("pointer-events", "none");
    text.classList.add(this.classes.nodeLabel);

    // Handle multi-line labels
    const lines = nodeData.label.split("\n");
    if (lines.length === 1) {
      text.textContent = nodeData.label;
    } else {
      // Create tspan for each line
      for (let i = 0; i < lines.length; i++) {
        const tspan = document.createElementNS(this.SVG_NS, "tspan");
        tspan.setAttribute("x", nodeData.width / 2);
        tspan.setAttribute("dy", i === 0 ? 0 : "1.2em");
        tspan.textContent = lines[i];
        text.appendChild(tspan);
      }
    }

    return text;
  }

  /**
   * Render resize handles
   *
   * @private
   */
  _renderHandles(group, nodeData) {
    const positions = [
      // Corners
      { x: 0, y: 0, cursor: "nw-resize" }, // Top-left
      { x: nodeData.width, y: 0, cursor: "ne-resize" }, // Top-right
      { x: 0, y: nodeData.height, cursor: "sw-resize" }, // Bottom-left
      { x: nodeData.width, y: nodeData.height, cursor: "se-resize" }, // Bottom-right

      // Edges
      { x: nodeData.width / 2, y: 0, cursor: "n-resize" }, // Top
      { x: nodeData.width, y: nodeData.height / 2, cursor: "e-resize" }, // Right
      { x: nodeData.width / 2, y: nodeData.height, cursor: "s-resize" }, // Bottom
      { x: 0, y: nodeData.height / 2, cursor: "w-resize" }, // Left
    ];

    const half = this.config.handleSize / 2;

    for (const pos of positions) {
      const rect = document.createElementNS(this.SVG_NS, "rect");
      rect.setAttribute("x", pos.x - half);
      rect.setAttribute("y", pos.y - half);
      rect.setAttribute("width", this.config.handleSize);
      rect.setAttribute("height", this.config.handleSize);
      rect.setAttribute("fill", this.config.handleStroke);
      rect.setAttribute("stroke", "#ffffff");
      rect.setAttribute("stroke-width", "1");
      rect.setAttribute("cursor", pos.cursor);
      rect.setAttribute("rx", "2");
      rect.classList.add(this.classes.handle);
      rect.setAttribute("data-handle-position", `${pos.x},${pos.y}`);

      group.appendChild(rect);
    }
  }

  /**
   * Render connection ports
   *
   * @private
   */
  _renderPorts(group, nodeData, ports) {
    for (const port of ports) {
      const circle = document.createElementNS(this.SVG_NS, "circle");

      circle.setAttribute("cx", port.x);
      circle.setAttribute("cy", port.y);
      circle.setAttribute("r", this.config.portRadius);
      circle.setAttribute("fill", port.fill || "#ffffff");
      circle.setAttribute("stroke", this.config.portStroke);
      circle.setAttribute("stroke-width", "1.5");
      circle.classList.add(this.classes.port);
      circle.setAttribute("data-port-id", port.id);
      circle.setAttribute("data-port-type", port.type || "default");

      // Add title for tooltip
      if (port.label) {
        const title = document.createElementNS(this.SVG_NS, "title");
        title.textContent = port.label;
        circle.appendChild(title);
      }

      group.appendChild(circle);
    }
  }

  /**
   * Update node visuals
   *
   * Updates visual properties without re-rendering entire node.
   *
   * @param {SVGElement} element - Node group element
   * @param {Object} updates - Properties to update
   *
   * @example
   * nodeView.update(element, {
   *   label: 'New Label',
   *   fill: '#00ff00'
   * });
   */
  update(element, updates) {
    if (!element || !element._nodeData) {
      throw new Error("NodeView.update: Invalid element");
    }

    const nodeData = element._nodeData;

    // Update position
    if (updates.x !== undefined || updates.y !== undefined) {
      const x = updates.x !== undefined ? updates.x : nodeData.x;
      const y = updates.y !== undefined ? updates.y : nodeData.y;
      element.setAttribute("transform", `translate(${x}, ${y})`);
      nodeData.x = x;
      nodeData.y = y;
    }

    // Update label
    if (updates.label !== undefined) {
      const labelElement = element.querySelector(`.${this.classes.nodeLabel}`);
      if (labelElement) {
        labelElement.textContent = updates.label;
      }
      nodeData.label = updates.label;
    }

    // Update fill color
    if (updates.fill !== undefined) {
      const shapeElement = element.querySelector(`.${this.classes.nodeShape}`);
      if (shapeElement) {
        const rect =
          shapeElement.querySelector("rect") ||
          shapeElement.querySelector("circle");
        if (rect) {
          rect.setAttribute("fill", updates.fill);
        }
      }
      nodeData.fill = updates.fill;
    }

    // Update stroke color
    if (updates.stroke !== undefined) {
      const shapeElement = element.querySelector(`.${this.classes.nodeShape}`);
      if (shapeElement) {
        const rect =
          shapeElement.querySelector("rect") ||
          shapeElement.querySelector("circle");
        if (rect) {
          rect.setAttribute("stroke", updates.stroke);
        }
      }
      nodeData.stroke = updates.stroke;
    }
  }

  /**
   * Set selected state
   *
   * @param {SVGElement} element - Node element
   * @param {boolean} isSelected - Selected state
   *
   * @example
   * nodeView.setSelected(element, true);
   */
  setSelected(element, isSelected) {
    if (isSelected) {
      element.classList.add(this.classes.nodeSelected);
      this._renderSelectionBox(element);
    } else {
      element.classList.remove(this.classes.nodeSelected);
      this._removeSelectionBox(element);
    }
  }

  /**
   * Set hovered state
   *
   * @param {SVGElement} element - Node element
   * @param {boolean} isHovered - Hovered state
   *
   * @example
   * nodeView.setHovered(element, true);
   */
  setHovered(element, isHovered) {
    if (isHovered) {
      element.classList.add(this.classes.nodeHovered);
      element.setAttribute("opacity", this.config.hoverOpacity);
    } else {
      element.classList.remove(this.classes.nodeHovered);
      element.removeAttribute("opacity");
    }
  }

  /**
   * Set disabled state
   *
   * @param {SVGElement} element - Node element
   * @param {boolean} isDisabled - Disabled state
   *
   * @example
   * nodeView.setDisabled(element, true);
   */
  setDisabled(element, isDisabled) {
    if (isDisabled) {
      element.classList.add(this.classes.nodeDisabled);
      element.setAttribute("opacity", this.config.disabledOpacity);
      element.setAttribute("pointer-events", "none");
    } else {
      element.classList.remove(this.classes.nodeDisabled);
      element.removeAttribute("opacity");
      element.removeAttribute("pointer-events");
    }
  }

  /**
   * Render selection box around node
   *
   * @private
   */
  _renderSelectionBox(element) {
    // Remove existing selection box
    this._removeSelectionBox(element);

    const nodeData = element._nodeData;
    const padding = this.config.selectionBoxPadding;

    const rect = document.createElementNS(this.SVG_NS, "rect");
    rect.setAttribute("x", -padding);
    rect.setAttribute("y", -padding);
    rect.setAttribute("width", nodeData.width + padding * 2);
    rect.setAttribute("height", nodeData.height + padding * 2);
    rect.setAttribute("fill", "none");
    rect.setAttribute("stroke", this.config.selectionBoxStroke);
    rect.setAttribute("stroke-width", "2");
    rect.setAttribute("stroke-dasharray", this.config.selectionBoxDasharray);
    rect.classList.add(this.classes.selectionBox);

    // Insert at beginning so it renders behind
    element.insertBefore(rect, element.firstChild);
  }

  /**
   * Remove selection box
   *
   * @private
   */
  _removeSelectionBox(element) {
    const selectionBox = element.querySelector(`.${this.classes.selectionBox}`);
    if (selectionBox) {
      selectionBox.remove();
    }
  }

  /**
   * Show badge/indicator
   *
   * @param {SVGElement} element - Node element
   * @param {Object} badge - Badge configuration
   * @param {string} [badge.text] - Badge text
   * @param {string} [badge.color] - Badge color
   * @param {string} [badge.position] - Position (top-right, top-left, etc.)
   *
   * @example
   * nodeView.addBadge(element, {
   *   text: '!',
   *   color: '#ff0000',
   *   position: 'top-right'
   * });
   */
  addBadge(element, badge) {
    if (!element._nodeData) {
      throw new Error("NodeView.addBadge: Invalid element");
    }

    const nodeData = element._nodeData;
    const position = badge.position || "top-right";

    // Calculate badge position
    let x, y;
    const offset = this.config.badgeSize / 2;

    switch (position) {
      case "top-right":
        x = nodeData.width - offset;
        y = -offset;
        break;
      case "top-left":
        x = -offset;
        y = -offset;
        break;
      case "bottom-right":
        x = nodeData.width - offset;
        y = nodeData.height + offset;
        break;
      case "bottom-left":
        x = -offset;
        y = nodeData.height + offset;
        break;
      default:
        x = nodeData.width - offset;
        y = -offset;
    }

    // Create badge group
    const badgeGroup = document.createElementNS(this.SVG_NS, "g");
    badgeGroup.classList.add(this.classes.badge);
    badgeGroup.setAttribute("transform", `translate(${x}, ${y})`);

    // Badge circle
    const circle = document.createElementNS(this.SVG_NS, "circle");
    circle.setAttribute("cx", 0);
    circle.setAttribute("cy", 0);
    circle.setAttribute("r", offset);
    circle.setAttribute("fill", badge.color || "#ff0000");
    circle.setAttribute("stroke", "#ffffff");
    circle.setAttribute("stroke-width", "1.5");
    badgeGroup.appendChild(circle);

    // Badge text
    if (badge.text) {
      const text = document.createElementNS(this.SVG_NS, "text");
      text.setAttribute("x", 0);
      text.setAttribute("y", 0);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("font-size", "10");
      text.setAttribute("font-weight", "bold");
      text.setAttribute("fill", "#ffffff");
      text.setAttribute("pointer-events", "none");
      text.textContent = badge.text;
      badgeGroup.appendChild(text);
    }

    element.appendChild(badgeGroup);
  }

  /**
   * Animate node
   *
   * @param {SVGElement} element - Node element
   * @param {Object} animation - Animation configuration
   * @param {Object} animation.from - Starting values
   * @param {Object} animation.to - Ending values
   * @param {number} [animation.duration] - Duration in ms
   * @param {Function} [animation.onComplete] - Completion callback
   *
   * @example
   * nodeView.animate(element, {
   *   from: { opacity: 0 },
   *   to: { opacity: 1 },
   *   duration: 300,
   *   onComplete: () => console.log('Done')
   * });
   */
  animate(element, animation) {
    const duration = animation.duration || this.config.animationDuration;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Apply animation
      for (const [key, fromValue] of Object.entries(animation.from)) {
        const toValue = animation.to[key];

        if (typeof fromValue === "number" && typeof toValue === "number") {
          const value = fromValue + (toValue - fromValue) * progress;
          if (key === "opacity") {
            element.setAttribute("opacity", value);
          }
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete
        if (typeof animation.onComplete === "function") {
          animation.onComplete();
        }
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Get node bounds
   *
   * @param {SVGElement} element - Node element
   *
   * @returns {Object} Bounding box { x, y, width, height }
   *
   * @example
   * const bounds = nodeView.getBounds(element);
   */
  getBounds(element) {
    if (!element._nodeData) {
      throw new Error("NodeView.getBounds: Invalid element");
    }

    const nodeData = element._nodeData;

    return {
      x: nodeData.x,
      y: nodeData.y,
      width: nodeData.width,
      height: nodeData.height,
    };
  }

  /**
   * Get node center
   *
   * @param {SVGElement} element - Node element
   *
   * @returns {Object} Center point { x, y }
   *
   * @example
   * const center = nodeView.getCenter(element);
   */
  getCenter(element) {
    const bounds = this.getBounds(element);

    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };
  }

  /**
   * Cleanup node element
   *
   * @param {SVGElement} element - Node element to remove
   *
   * @example
   * nodeView.cleanup(element);
   */
  cleanup(element) {
    if (element && element.parentElement) {
      element.parentElement.removeChild(element);
    }
  }

  /**
   * Validate node data
   *
   * @private
   */
  _validateNodeData(nodeData) {
    if (typeof nodeData !== "object" || nodeData === null) {
      throw new Error("NodeView: Node data must be object");
    }

    if (!nodeData.id || typeof nodeData.id !== "string") {
      throw new Error("NodeView: Node data must have id (string)");
    }

    if (!nodeData.shapeType || typeof nodeData.shapeType !== "string") {
      throw new Error("NodeView: Node data must have shapeType (string)");
    }

    if (
      typeof nodeData.x !== "number" ||
      typeof nodeData.y !== "number" ||
      typeof nodeData.width !== "number" ||
      typeof nodeData.height !== "number"
    ) {
      throw new Error(
        "NodeView: Node data must have numeric x, y, width, height"
      );
    }
  }
}

// Export for use in other modules
export { NodeView };
