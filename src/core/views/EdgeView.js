/**
 * EdgeView.js - Edge Visual Rendering & Representation
 *
 * Handles SVG rendering, visual styling, and DOM manipulation for edge entities.
 * Manages the visual representation of edges (connections) on the canvas including
 * paths, arrows, labels, and interactive feedback.
 *
 * DEPENDENCIES: None (pure SVG rendering)
 *
 * @module src/views/EdgeView
 * @version 1.0.0
 *
 * Purpose:
 * - Create SVG visual representation of edges
 * - Render paths with different routing types (straight, curved, orthogonal)
 * - Apply styling and theming
 * - Handle selection and hover states
 * - Update edge visuals when data changes
 * - Render edge labels and decorations
 * - Provide arrow/endpoint markers
 * - Handle visual feedback for interactions
 *
 * Responsibilities:
 * - Render edge path SVG elements
 * - Calculate path based on source/target node positions
 * - Apply edge styling (stroke, width, dash pattern)
 * - Update visual state (selected, hovered, disabled)
 * - Render edge labels and text
 * - Manage arrow markers and endpoints
 * - Handle path animations
 * - Clean up DOM elements
 * - Calculate label positioning
 *
 * Architecture:
 * - Group wrapper (g element) contains all edge visuals
 * - Path element (main connection line)
 * - Arrow markers (SVG markers for direction)
 * - Label element (text along path)
 * - Selection indicators
 *
 * @example
 * const edgeView = new EdgeView();
 *
 * // Create edge visual
 * const svgElement = edgeView.render({
 *   id: 'edge-1',
 *   sourceNode: { x: 100, y: 100, width: 120, height: 80 },
 *   targetNode: { x: 300, y: 150, width: 100, height: 80 },
 *   label: 'connects',
 *   routingType: 'curved'
 * });
 *
 * canvas.appendChild(svgElement);
 *
 * // Update visual state
 * edgeView.setSelected(svgElement, true);
 * edgeView.setHovered(svgElement, true);
 *
 * // Update edge
 * edgeView.update(svgElement, {
 *   label: 'new label',
 *   stroke: '#ff0000'
 * });
 */

/**
 * EdgeView Class
 *
 * Handles visual rendering and representation of edges.
 */
class EdgeView {
  /**
   * Initialize the edge view
   *
   * @example
   * const view = new EdgeView();
   */
  constructor() {
    // SVG namespace
    this.SVG_NS = "http://www.w3.org/2000/svg";

    // Configuration
    this.config = {
      strokeWidth: 2,
      stroke: "#666666",
      hoverStrokeWidth: 3,
      selectedStrokeWidth: 3,
      selectionDasharray: "5,5",
      hoverOpacity: 0.8,
      disabledOpacity: 0.5,
      labelBackground: true,
      labelPadding: 4,
      arrowSize: 10,
      arrowColor: "#666666",
      curveOffsetFactor: 0.2,
      animationDuration: 200,
    };

    // CSS classes for styling
    this.classes = {
      edge: "edge",
      edgeGroup: "edge-group",
      edgePath: "edge-path",
      edgeLabel: "edge-label",
      edgeLabelBackground: "edge-label-background",
      edgeSelected: "edge-selected",
      edgeHovered: "edge-hovered",
      edgeDisabled: "edge-disabled",
      selectionIndicator: "edge-selection-indicator",
    };

    // Arrow marker counter for unique IDs
    this.arrowMarkerId = 0;
  }

  /**
   * Render an edge
   *
   * Creates SVG element representing the edge with path and decorations.
   *
   * @param {Object} edgeData - Edge data
   * @param {string} edgeData.id - Edge ID
   * @param {Object} edgeData.sourceNode - Source node data
   * @param {number} edgeData.sourceNode.x - Source X
   * @param {number} edgeData.sourceNode.y - Source Y
   * @param {number} edgeData.sourceNode.width - Source width
   * @param {number} edgeData.sourceNode.height - Source height
   * @param {Object} edgeData.targetNode - Target node data
   * @param {number} edgeData.targetNode.x - Target X
   * @param {number} edgeData.targetNode.y - Target Y
   * @param {number} edgeData.targetNode.width - Target width
   * @param {number} edgeData.targetNode.height - Target height
   * @param {string} [edgeData.label] - Edge label
   * @param {string} [edgeData.stroke] - Stroke color
   * @param {number} [edgeData.strokeWidth] - Stroke width
   * @param {string} [edgeData.routingType] - Routing type (straight, curved, orthogonal)
   * @param {Object} [options] - Render options
   * @param {boolean} [options.showArrow] - Show arrow marker?
   * @param {string} [options.arrowType] - Arrow type (standard, triangle, etc.)
   * @param {boolean} [options.bidirectional] - Show arrows on both ends?
   *
   * @returns {SVGElement} Rendered edge group element
   *
   * @throws {Error} If edge data is invalid
   *
   * @example
   * const edgeElement = edgeView.render({
   *   id: 'edge-1',
   *   sourceNode: { x: 100, y: 100, width: 120, height: 80 },
   *   targetNode: { x: 300, y: 150, width: 100, height: 80 },
   *   label: 'connects to',
   *   routingType: 'curved'
   * }, { showArrow: true });
   */
  render(edgeData, options = {}) {
    // Validate edge data
    this._validateEdgeData(edgeData);

    // Create main group
    const group = document.createElementNS(this.SVG_NS, "g");
    group.classList.add(this.classes.edgeGroup);
    group.setAttribute("data-edge-id", edgeData.id);

    // Calculate path
    const routingType = edgeData.routingType || "straight";
    const pathData = this._calculatePath(
      edgeData.sourceNode,
      edgeData.targetNode,
      routingType
    );

    // Create path element
    const pathElement = this._renderPath(edgeData, pathData, options);
    group.appendChild(pathElement);

    // Create label if provided
    if (edgeData.label) {
      const labelElement = this._renderLabel(edgeData, pathData);
      group.appendChild(labelElement);
    }

    // Store edge data on element for later access
    group._edgeData = edgeData;
    group._pathData = pathData;

    return group;
  }

  /**
   * Render path element
   *
   * @private
   */
  _renderPath(edgeData, pathData, options) {
    const path = document.createElementNS(this.SVG_NS, "path");

    path.setAttribute("d", pathData.path);
    path.setAttribute("stroke", edgeData.stroke || this.config.stroke);
    path.setAttribute(
      "stroke-width",
      edgeData.strokeWidth || this.config.strokeWidth
    );
    path.setAttribute("fill", "none");
    path.classList.add(this.classes.edgePath);

    // Add arrow marker if requested
    if (options.showArrow !== false) {
      const markerId = this._createArrowMarker(
        edgeData.stroke || this.config.stroke,
        options.arrowType || "standard"
      );
      path.setAttribute("marker-end", `url(#${markerId})`);

      // Bidirectional arrows
      if (options.bidirectional) {
        const markerId2 = this._createArrowMarker(
          edgeData.stroke || this.config.stroke,
          "reverse"
        );
        path.setAttribute("marker-start", `url(#${markerId2})`);
      }
    }

    return path;
  }

  /**
   * Render edge label
   *
   * @private
   */
  _renderLabel(edgeData, pathData) {
    const group = document.createElementNS(this.SVG_NS, "g");
    group.classList.add(this.classes.edgeLabel);

    // Calculate label position (midpoint)
    const midPoint = this._calculateMidPoint(pathData.path);

    // Background rectangle if enabled
    if (this.config.labelBackground) {
      const bgRect = document.createElementNS(this.SVG_NS, "rect");
      bgRect.setAttribute("x", midPoint.x - 40);
      bgRect.setAttribute("y", midPoint.y - 10);
      bgRect.setAttribute("width", 80);
      bgRect.setAttribute("height", 20);
      bgRect.setAttribute("fill", "#ffffff");
      bgRect.setAttribute("stroke", "#cccccc");
      bgRect.setAttribute("stroke-width", "1");
      bgRect.setAttribute("rx", "3");
      bgRect.classList.add(this.classes.edgeLabelBackground);
      group.appendChild(bgRect);
    }

    // Text element
    const text = document.createElementNS(this.SVG_NS, "text");
    text.setAttribute("x", midPoint.x);
    text.setAttribute("y", midPoint.y);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("font-family", "Arial, sans-serif");
    text.setAttribute("font-size", "12");
    text.setAttribute("fill", "#333333");
    text.setAttribute("pointer-events", "none");
    text.textContent = edgeData.label;

    group.appendChild(text);

    return group;
  }

  /**
   * Create arrow marker
   *
   * @private
   */
  _createArrowMarker(color, type = "standard") {
    const svg = this._getSVGRoot();
    if (!svg) return null;

    let defs = svg.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS(this.SVG_NS, "defs");
      svg.insertBefore(defs, svg.firstChild);
    }

    const markerId = `edge-arrow-${this.arrowMarkerId++}-${type}`;

    // Remove existing marker if present
    const existing = defs.querySelector(`#${markerId}`);
    if (existing) {
      existing.remove();
    }

    // Create marker
    const marker = document.createElementNS(this.SVG_NS, "marker");
    marker.setAttribute("id", markerId);
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "10");
    marker.setAttribute("refX", "8");
    marker.setAttribute("refY", "3");
    marker.setAttribute("orient", "auto");
    marker.setAttribute("markerUnits", "strokeWidth");

    // Different arrow types
    if (type === "reverse") {
      // Reverse arrow (points left)
      marker.setAttribute("refX", "-8");

      const polygon = document.createElementNS(this.SVG_NS, "polygon");
      polygon.setAttribute("points", "0 0, -10 3, 0 6");
      polygon.setAttribute("fill", color);
      marker.appendChild(polygon);
    } else if (type === "diamond") {
      // Diamond arrow
      const polygon = document.createElementNS(this.SVG_NS, "polygon");
      polygon.setAttribute("points", "0 3, 5 0, 10 3, 5 6");
      polygon.setAttribute("fill", color);
      marker.appendChild(polygon);
    } else {
      // Standard arrow (triangle)
      const polygon = document.createElementNS(this.SVG_NS, "polygon");
      polygon.setAttribute("points", "0 0, 10 3, 0 6");
      polygon.setAttribute("fill", color);
      marker.appendChild(polygon);
    }

    defs.appendChild(marker);

    return markerId;
  }

  /**
   * Get SVG root element
   *
   * @private
   */
  _getSVGRoot() {
    // This would need to be passed in or found from DOM
    // For now, return null - can be improved
    return document.querySelector("svg.editor-canvas");
  }

  /**
   * Calculate edge path
   *
   * @private
   */
  _calculatePath(sourceNode, targetNode, routingType) {
    // Calculate connection points (node centers or edge points)
    const source = {
      x: sourceNode.x + sourceNode.width / 2,
      y: sourceNode.y + sourceNode.height / 2,
    };

    const target = {
      x: targetNode.x + targetNode.width / 2,
      y: targetNode.y + targetNode.height / 2,
    };

    let path;

    if (routingType === "curved") {
      path = this._createCurvedPath(source, target);
    } else if (routingType === "orthogonal") {
      path = this._createOrthogonalPath(source, target);
    } else {
      // Default: straight line
      path = `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
    }

    return {
      path,
      source,
      target,
      distance: Math.sqrt(
        Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2)
      ),
    };
  }

  /**
   * Create curved (Bézier) path
   *
   * @private
   */
  _createCurvedPath(source, target) {
    const dx = target.x - source.x;
    const dy = target.y - source.y;

    // Control point distance based on path length
    const distance = Math.sqrt(dx * dx + dy * dy);
    const offsetDistance = Math.max(
      distance * this.config.curveOffsetFactor,
      50
    );

    // Perpendicular offset for control point
    const angle = Math.atan2(dy, dx);
    const cpX = (source.x + target.x) / 2 + Math.sin(angle) * offsetDistance;
    const cpY = (source.y + target.y) / 2 - Math.cos(angle) * offsetDistance;

    return `M ${source.x} ${source.y} Q ${cpX} ${cpY} ${target.x} ${target.y}`;
  }

  /**
   * Create orthogonal (Manhattan) path
   *
   * @private
   */
  _createOrthogonalPath(source, target) {
    const midX = (source.x + target.x) / 2;

    return `M ${source.x} ${source.y} L ${midX} ${source.y} L ${midX} ${target.y} L ${target.x} ${target.y}`;
  }

  /**
   * Calculate midpoint of path
   *
   * For now, simple midpoint calculation
   *
   * @private
   */
  _calculateMidPoint(pathString) {
    // Parse M x y L x y format
    const parts = pathString.split(/[MLQ]/);
    let lastX = 0,
      lastY = 0;

    for (const part of parts) {
      const coords = part
        .trim()
        .split(/[\s,]+/)
        .filter((c) => c);
      if (coords.length >= 2) {
        lastX = parseFloat(coords[coords.length - 2]);
        lastY = parseFloat(coords[coords.length - 1]);
      }
    }

    // Extract first point
    const startMatch = pathString.match(/M\s*([^ ,]+)\s*([^ ,]+)/);
    const startX = startMatch ? parseFloat(startMatch[1]) : 0;
    const startY = startMatch ? parseFloat(startMatch[2]) : 0;

    // Midpoint
    return {
      x: (startX + lastX) / 2,
      y: (startY + lastY) / 2,
    };
  }

  /**
   * Update edge visuals
   *
   * @param {SVGElement} element - Edge group element
   * @param {Object} updates - Properties to update
   * @param {Object} [sourceNode] - Updated source node (for path recalc)
   * @param {Object} [targetNode] - Updated target node (for path recalc)
   *
   * @example
   * edgeView.update(element, {
   *   label: 'new label',
   *   stroke: '#ff0000'
   * }, sourceNode, targetNode);
   */
  update(element, updates, sourceNode, targetNode) {
    if (!element || !element._edgeData) {
      throw new Error("EdgeView.update: Invalid element");
    }

    const edgeData = element._edgeData;

    // Update label
    if (updates.label !== undefined) {
      const labelGroup = element.querySelector(`.${this.classes.edgeLabel}`);
      if (labelGroup) {
        const text = labelGroup.querySelector("text");
        if (text) {
          text.textContent = updates.label;
        }
      }
      edgeData.label = updates.label;
    }

    // Update stroke color
    if (updates.stroke !== undefined) {
      const pathElement = element.querySelector(`.${this.classes.edgePath}`);
      if (pathElement) {
        pathElement.setAttribute("stroke", updates.stroke);
      }
      edgeData.stroke = updates.stroke;
    }

    // Update stroke width
    if (updates.strokeWidth !== undefined) {
      const pathElement = element.querySelector(`.${this.classes.edgePath}`);
      if (pathElement) {
        pathElement.setAttribute("stroke-width", updates.strokeWidth);
      }
      edgeData.strokeWidth = updates.strokeWidth;
    }

    // Recalculate path if nodes updated
    if (sourceNode || targetNode) {
      const source = sourceNode || edgeData.sourceNode;
      const target = targetNode || edgeData.targetNode;
      const routingType = edgeData.routingType || "straight";

      const pathData = this._calculatePath(source, target, routingType);
      const pathElement = element.querySelector(`.${this.classes.edgePath}`);

      if (pathElement) {
        pathElement.setAttribute("d", pathData.path);
      }

      edgeData.sourceNode = source;
      edgeData.targetNode = target;
      element._pathData = pathData;
    }
  }

  /**
   * Set selected state
   *
   * @param {SVGElement} element - Edge element
   * @param {boolean} isSelected - Selected state
   *
   * @example
   * edgeView.setSelected(element, true);
   */
  setSelected(element, isSelected) {
    const pathElement = element.querySelector(`.${this.classes.edgePath}`);

    if (isSelected) {
      element.classList.add(this.classes.edgeSelected);
      if (pathElement) {
        pathElement.setAttribute(
          "stroke-width",
          this.config.selectedStrokeWidth
        );
        pathElement.setAttribute(
          "stroke-dasharray",
          this.config.selectionDasharray
        );
      }
    } else {
      element.classList.remove(this.classes.edgeSelected);
      if (pathElement) {
        const edgeData = element._edgeData;
        pathElement.setAttribute(
          "stroke-width",
          edgeData.strokeWidth || this.config.strokeWidth
        );
        pathElement.removeAttribute("stroke-dasharray");
      }
    }
  }

  /**
   * Set hovered state
   *
   * @param {SVGElement} element - Edge element
   * @param {boolean} isHovered - Hovered state
   *
   * @example
   * edgeView.setHovered(element, true);
   */
  setHovered(element, isHovered) {
    const pathElement = element.querySelector(`.${this.classes.edgePath}`);

    if (isHovered) {
      element.classList.add(this.classes.edgeHovered);
      if (pathElement) {
        pathElement.setAttribute("stroke-width", this.config.hoverStrokeWidth);
      }
    } else {
      element.classList.remove(this.classes.edgeHovered);
      if (pathElement) {
        const edgeData = element._edgeData;
        pathElement.setAttribute(
          "stroke-width",
          edgeData.strokeWidth || this.config.strokeWidth
        );
      }
    }
  }

  /**
   * Set disabled state
   *
   * @param {SVGElement} element - Edge element
   * @param {boolean} isDisabled - Disabled state
   *
   * @example
   * edgeView.setDisabled(element, true);
   */
  setDisabled(element, isDisabled) {
    if (isDisabled) {
      element.classList.add(this.classes.edgeDisabled);
      element.setAttribute("opacity", this.config.disabledOpacity);
      element.setAttribute("pointer-events", "none");
    } else {
      element.classList.remove(this.classes.edgeDisabled);
      element.removeAttribute("opacity");
      element.removeAttribute("pointer-events");
    }
  }

  /**
   * Animate edge
   *
   * @param {SVGElement} element - Edge element
   * @param {Object} animation - Animation configuration
   * @param {Object} animation.from - Starting values
   * @param {Object} animation.to - Ending values
   * @param {number} [animation.duration] - Duration in ms
   * @param {Function} [animation.onComplete] - Completion callback
   *
   * @example
   * edgeView.animate(element, {
   *   from: { opacity: 0 },
   *   to: { opacity: 1 },
   *   duration: 300
   * });
   */
  animate(element, animation) {
    const duration = animation.duration || this.config.animationDuration;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const pathElement = element.querySelector(`.${this.classes.edgePath}`);

      // Apply animation
      for (const [key, fromValue] of Object.entries(animation.from)) {
        const toValue = animation.to[key];

        if (typeof fromValue === "number" && typeof toValue === "number") {
          const value = fromValue + (toValue - fromValue) * progress;

          if (key === "opacity") {
            element.setAttribute("opacity", value);
          } else if (key === "strokeWidth" && pathElement) {
            pathElement.setAttribute("stroke-width", value);
          }
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        if (typeof animation.onComplete === "function") {
          animation.onComplete();
        }
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Get edge bounds
   *
   * @param {SVGElement} element - Edge element
   *
   * @returns {Object} Bounding box { x, y, width, height }
   *
   * @example
   * const bounds = edgeView.getBounds(element);
   */
  getBounds(element) {
    if (!element || !element._pathData) {
      throw new Error("EdgeView.getBounds: Invalid element");
    }

    const pathData = element._pathData;
    const padding = 10;

    return {
      x: Math.min(pathData.source.x, pathData.target.x) - padding,
      y: Math.min(pathData.source.y, pathData.target.y) - padding,
      width: Math.abs(pathData.target.x - pathData.source.x) + padding * 2,
      height: Math.abs(pathData.target.y - pathData.source.y) + padding * 2,
    };
  }

  /**
   * Get edge length (distance between endpoints)
   *
   * @param {SVGElement} element - Edge element
   *
   * @returns {number} Distance in pixels
   *
   * @example
   * const length = edgeView.getLength(element);
   */
  getLength(element) {
    if (!element || !element._pathData) {
      throw new Error("EdgeView.getLength: Invalid element");
    }

    return element._pathData.distance;
  }

  /**
   * Cleanup edge element
   *
   * @param {SVGElement} element - Edge element to remove
   *
   * @example
   * edgeView.cleanup(element);
   */
  cleanup(element) {
    if (element && element.parentElement) {
      element.parentElement.removeChild(element);
    }
  }

  /**
   * Validate edge data
   *
   * @private
   */
  _validateEdgeData(edgeData) {
    if (typeof edgeData !== "object" || edgeData === null) {
      throw new Error("EdgeView: Edge data must be object");
    }

    if (!edgeData.id || typeof edgeData.id !== "string") {
      throw new Error("EdgeView: Edge data must have id (string)");
    }

    if (!edgeData.sourceNode || typeof edgeData.sourceNode !== "object") {
      throw new Error("EdgeView: Edge data must have sourceNode (object)");
    }

    if (!edgeData.targetNode || typeof edgeData.targetNode !== "object") {
      throw new Error("EdgeView: Edge data must have targetNode (object)");
    }

    // Validate node data
    const validateNode = (node) => {
      return (
        typeof node.x === "number" &&
        typeof node.y === "number" &&
        typeof node.width === "number" &&
        typeof node.height === "number"
      );
    };

    if (!validateNode(edgeData.sourceNode)) {
      throw new Error(
        "EdgeView: sourceNode must have numeric x, y, width, height"
      );
    }

    if (!validateNode(edgeData.targetNode)) {
      throw new Error(
        "EdgeView: targetNode must have numeric x, y, width, height"
      );
    }
  }
}

// Export for use in other modules
export { EdgeView };
