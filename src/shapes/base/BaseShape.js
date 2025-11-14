/**
 * BaseShape.js - Abstract base class for all shapes
 *
 * All shape classes should extend this base class and implement the required methods.
 * Provides common functionality for shape rendering, ports, handles, and transformations.
 *
 * @module shapes/base/BaseShape
 * @abstract
 */

export class BaseShape {
  /**
   * Create a new shape
   * @param {Object} config - Shape configuration
   */
  constructor(config = {}) {
    if (new.target === BaseShape) {
      throw new Error(
        "BaseShape is abstract and cannot be instantiated directly"
      );
    }

    // Basic properties
    this.id = config.id;
    this.type = config.type || "base";
    this.name = config.name || "Base Shape";
    this.category = config.category || "basic";

    // Dimensions
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.width = config.width || 100;
    this.height = config.height || 80;
    this.rotation = config.rotation || 0;

    // Style
    this.style = {
      fill: config.style?.fill || "#ffffff",
      stroke: config.style?.stroke || "#000000",
      strokeWidth: config.style?.strokeWidth || 2,
      opacity: config.style?.opacity || 1,
      ...config.style,
    };

    // Text/Label
    this.label = config.label || "";
    this.textStyle = {
      fontSize: config.textStyle?.fontSize || 14,
      fontFamily: config.textStyle?.fontFamily || "Arial, sans-serif",
      fontWeight: config.textStyle?.fontWeight || "normal",
      textAlign: config.textStyle?.textAlign || "center",
      verticalAlign: config.textStyle?.verticalAlign || "middle",
      color: config.textStyle?.color || "#000000",
      ...config.textStyle,
    };

    // Ports (connection points)
    this.ports = config.ports || [];
    this.portsEnabled = config.portsEnabled !== false;

    // Handles (resize handles)
    this.handles = config.handles || [];
    this.handlesEnabled = config.handlesEnabled !== false;

    // Constraints
    this.constraints = {
      minWidth: config.constraints?.minWidth || 20,
      minHeight: config.constraints?.minHeight || 20,
      maxWidth: config.constraints?.maxWidth || 1000,
      maxHeight: config.constraints?.maxHeight || 1000,
      aspectRatio: config.constraints?.aspectRatio || null,
      ...config.constraints,
    };

    // Features
    this.features = {
      resizable: config.features?.resizable !== false,
      rotatable: config.features?.rotatable !== false,
      connectable: config.features?.connectable !== false,
      groupable: config.features?.groupable !== false,
      lockable: config.features?.lockable !== false,
      clonable: config.features?.clonable !== false,
      ...config.features,
    };

    // State
    this.selected = false;
    this.hovered = false;
    this.locked = false;
    this.visible = true;

    // Custom data
    this.data = config.data || {};
  }

  /**
   * Render the shape to SVG
   * Must be implemented by subclasses
   * @abstract
   * @returns {SVGElement}
   */
  render() {
    throw new Error("render() must be implemented by subclass");
  }

  /**
   * Get the shape's path for hit detection
   * Must be implemented by subclasses
   * @abstract
   * @returns {Path2D|string}
   */
  getPath() {
    throw new Error("getPath() must be implemented by subclass");
  }

  /**
   * Get shape bounds
   * @returns {Object} - {x, y, width, height, left, right, top, bottom, centerX, centerY}
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height,
      centerX: this.x + this.width / 2,
      centerY: this.y + this.height / 2,
    };
  }

  /**
   * Check if a point is inside the shape
   * @param {Object} point - {x, y}
   * @returns {boolean}
   */
  containsPoint(point) {
    const bounds = this.getBounds();
    return (
      point.x >= bounds.left &&
      point.x <= bounds.right &&
      point.y >= bounds.top &&
      point.y <= bounds.bottom
    );
  }

  /**
   * Set position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Move by delta
   * @param {number} dx - Delta X
   * @param {number} dy - Delta Y
   */
  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  /**
   * Set size
   * @param {number} width - Width
   * @param {number} height - Height
   */
  setSize(width, height) {
    // Apply constraints
    this.width = Math.max(
      this.constraints.minWidth,
      Math.min(this.constraints.maxWidth, width)
    );
    this.height = Math.max(
      this.constraints.minHeight,
      Math.min(this.constraints.maxHeight, height)
    );

    // Apply aspect ratio if set
    if (this.constraints.aspectRatio) {
      this.height = this.width / this.constraints.aspectRatio;
    }
  }

  /**
   * Resize by delta
   * @param {number} dw - Delta width
   * @param {number} dh - Delta height
   */
  resize(dw, dh) {
    this.setSize(this.width + dw, this.height + dh);
  }

  /**
   * Set rotation
   * @param {number} angle - Rotation angle in degrees
   */
  setRotation(angle) {
    this.rotation = angle % 360;
  }

  /**
   * Rotate by delta
   * @param {number} delta - Rotation delta in degrees
   */
  rotate(delta) {
    this.setRotation(this.rotation + delta);
  }

  /**
   * Set style properties
   * @param {Object} style - Style properties
   */
  setStyle(style) {
    Object.assign(this.style, style);
  }

  /**
   * Set text/label
   * @param {string} text - Text content
   */
  setText(text) {
    this.label = text;
  }

  /**
   * Set text style
   * @param {Object} textStyle - Text style properties
   */
  setTextStyle(textStyle) {
    Object.assign(this.textStyle, textStyle);
  }

  /**
   * Get port positions
   * @returns {Array} - Array of {id, x, y, type}
   */
  getPortPositions() {
    if (!this.portsEnabled || this.ports.length === 0) {
      return [];
    }

    const bounds = this.getBounds();

    return this.ports.map((port) => ({
      id: port.id,
      x: bounds.x + bounds.width * port.x,
      y: bounds.y + bounds.height * port.y,
      type: port.type || "both",
      direction: port.direction || "any",
    }));
  }

  /**
   * Get handle positions
   * @returns {Array} - Array of {id, x, y, cursor}
   */
  getHandlePositions() {
    if (!this.handlesEnabled || !this.features.resizable) {
      return [];
    }

    const bounds = this.getBounds();
    const handles = [];

    // Standard 8 handles
    const positions = {
      nw: { x: bounds.left, y: bounds.top, cursor: "nw-resize" },
      n: { x: bounds.centerX, y: bounds.top, cursor: "n-resize" },
      ne: { x: bounds.right, y: bounds.top, cursor: "ne-resize" },
      e: { x: bounds.right, y: bounds.centerY, cursor: "e-resize" },
      se: { x: bounds.right, y: bounds.bottom, cursor: "se-resize" },
      s: { x: bounds.centerX, y: bounds.bottom, cursor: "s-resize" },
      sw: { x: bounds.left, y: bounds.bottom, cursor: "sw-resize" },
      w: { x: bounds.left, y: bounds.centerY, cursor: "w-resize" },
    };

    this.handles.forEach((handleId) => {
      if (positions[handleId]) {
        handles.push({
          id: handleId,
          ...positions[handleId],
        });
      }
    });

    return handles;
  }

  /**
   * Get nearest port to a point
   * @param {Object} point - {x, y}
   * @returns {Object|null} - Port object or null
   */
  getNearestPort(point) {
    const ports = this.getPortPositions();
    if (ports.length === 0) return null;

    let nearest = null;
    let minDistance = Infinity;

    ports.forEach((port) => {
      const dx = port.x - point.x;
      const dy = port.y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = port;
      }
    });

    return nearest;
  }

  /**
   * Clone the shape
   * @returns {BaseShape}
   */
  clone() {
    const config = this.serialize();
    return new this.constructor(config);
  }

  /**
   * Serialize shape to JSON
   * @returns {Object}
   */
  serialize() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      category: this.category,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      style: { ...this.style },
      label: this.label,
      textStyle: { ...this.textStyle },
      ports: this.ports.map((p) => ({ ...p })),
      portsEnabled: this.portsEnabled,
      handles: [...this.handles],
      handlesEnabled: this.handlesEnabled,
      constraints: { ...this.constraints },
      features: { ...this.features },
      locked: this.locked,
      visible: this.visible,
      data: { ...this.data },
    };
  }

  /**
   * Deserialize shape from JSON
   * @param {Object} data - Serialized shape data
   */
  deserialize(data) {
    Object.assign(this, data);
  }

  /**
   * Update shape properties
   * @param {Object} updates - Properties to update
   */
  update(updates) {
    Object.keys(updates).forEach((key) => {
      if (key === "style") {
        this.setStyle(updates.style);
      } else if (key === "textStyle") {
        this.setTextStyle(updates.textStyle);
      } else if (this.hasOwnProperty(key)) {
        this[key] = updates[key];
      }
    });
  }

  /**
   * Validate shape configuration
   * @returns {Object} - {valid: boolean, errors: Array}
   */
  validate() {
    const errors = [];

    // Validate dimensions
    if (this.width < this.constraints.minWidth) {
      errors.push(
        `Width ${this.width} is less than minimum ${this.constraints.minWidth}`
      );
    }
    if (this.width > this.constraints.maxWidth) {
      errors.push(
        `Width ${this.width} exceeds maximum ${this.constraints.maxWidth}`
      );
    }
    if (this.height < this.constraints.minHeight) {
      errors.push(
        `Height ${this.height} is less than minimum ${this.constraints.minHeight}`
      );
    }
    if (this.height > this.constraints.maxHeight) {
      errors.push(
        `Height ${this.height} exceeds maximum ${this.constraints.maxHeight}`
      );
    }

    // Validate aspect ratio
    if (this.constraints.aspectRatio) {
      const actualRatio = this.width / this.height;
      if (Math.abs(actualRatio - this.constraints.aspectRatio) > 0.01) {
        errors.push(
          `Aspect ratio ${actualRatio} does not match constraint ${this.constraints.aspectRatio}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get shape info for debugging
   * @returns {Object}
   */
  getInfo() {
    return {
      type: this.type,
      name: this.name,
      category: this.category,
      bounds: this.getBounds(),
      style: this.style,
      features: this.features,
      locked: this.locked,
      visible: this.visible,
    };
  }

  /**
   * Destroy shape and cleanup resources
   */
  destroy() {
    // Override in subclass if needed
  }
}
