/**
 * ShapeBuilder.js - Fluent API for building shapes
 *
 * Provides a chainable interface for creating and configuring shapes.
 * Makes shape creation more readable and flexible.
 *
 * @module shapes/base/ShapeBuilder
 *
 * @example
 * const rect = new ShapeBuilder('rect')
 *   .setPosition(100, 100)
 *   .setSize(200, 150)
 *   .setStyle({ fill: '#ff0000' })
 *   .setText('Hello')
 *   .addPort('top', 0.5, 0, 'input')
 *   .build();
 */

export class ShapeBuilder {
  /**
   * Create a new shape builder
   * @param {string} type - Shape type
   * @param {Object} shapeRegistry - Shape registry instance
   */
  constructor(type, shapeRegistry = null) {
    this.shapeRegistry = shapeRegistry;
    this.config = {
      type,
      style: {},
      textStyle: {},
      ports: [],
      handles: [],
      constraints: {},
      features: {},
      data: {},
    };
  }

  /**
   * Set shape ID
   * @param {string} id - Shape ID
   * @returns {ShapeBuilder}
   */
  setId(id) {
    this.config.id = id;
    return this;
  }

  /**
   * Set shape name
   * @param {string} name - Shape name
   * @returns {ShapeBuilder}
   */
  setName(name) {
    this.config.name = name;
    return this;
  }

  /**
   * Set shape category
   * @param {string} category - Shape category
   * @returns {ShapeBuilder}
   */
  setCategory(category) {
    this.config.category = category;
    return this;
  }

  /**
   * Set position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {ShapeBuilder}
   */
  setPosition(x, y) {
    this.config.x = x;
    this.config.y = y;
    return this;
  }

  /**
   * Set size
   * @param {number} width - Width
   * @param {number} height - Height
   * @returns {ShapeBuilder}
   */
  setSize(width, height) {
    this.config.width = width;
    this.config.height = height;
    return this;
  }

  /**
   * Set bounds (position and size)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} width - Width
   * @param {number} height - Height
   * @returns {ShapeBuilder}
   */
  setBounds(x, y, width, height) {
    this.config.x = x;
    this.config.y = y;
    this.config.width = width;
    this.config.height = height;
    return this;
  }

  /**
   * Set rotation
   * @param {number} rotation - Rotation in degrees
   * @returns {ShapeBuilder}
   */
  setRotation(rotation) {
    this.config.rotation = rotation;
    return this;
  }

  /**
   * Set style properties
   * @param {Object} style - Style object
   * @returns {ShapeBuilder}
   */
  setStyle(style) {
    Object.assign(this.config.style, style);
    return this;
  }

  /**
   * Set fill color
   * @param {string} fill - Fill color
   * @returns {ShapeBuilder}
   */
  setFill(fill) {
    this.config.style.fill = fill;
    return this;
  }

  /**
   * Set stroke color
   * @param {string} stroke - Stroke color
   * @returns {ShapeBuilder}
   */
  setStroke(stroke) {
    this.config.style.stroke = stroke;
    return this;
  }

  /**
   * Set stroke width
   * @param {number} strokeWidth - Stroke width
   * @returns {ShapeBuilder}
   */
  setStrokeWidth(strokeWidth) {
    this.config.style.strokeWidth = strokeWidth;
    return this;
  }

  /**
   * Set opacity
   * @param {number} opacity - Opacity (0-1)
   * @returns {ShapeBuilder}
   */
  setOpacity(opacity) {
    this.config.style.opacity = opacity;
    return this;
  }

  /**
   * Set text/label
   * @param {string} text - Text content
   * @returns {ShapeBuilder}
   */
  setText(text) {
    this.config.label = text;
    return this;
  }

  /**
   * Set text style
   * @param {Object} textStyle - Text style object
   * @returns {ShapeBuilder}
   */
  setTextStyle(textStyle) {
    Object.assign(this.config.textStyle, textStyle);
    return this;
  }

  /**
   * Set font size
   * @param {number} fontSize - Font size
   * @returns {ShapeBuilder}
   */
  setFontSize(fontSize) {
    this.config.textStyle.fontSize = fontSize;
    return this;
  }

  /**
   * Set font family
   * @param {string} fontFamily - Font family
   * @returns {ShapeBuilder}
   */
  setFontFamily(fontFamily) {
    this.config.textStyle.fontFamily = fontFamily;
    return this;
  }

  /**
   * Set text color
   * @param {string} color - Text color
   * @returns {ShapeBuilder}
   */
  setTextColor(color) {
    this.config.textStyle.color = color;
    return this;
  }

  /**
   * Add a port
   * @param {string} id - Port ID
   * @param {number} x - Relative X position (0-1)
   * @param {number} y - Relative Y position (0-1)
   * @param {string} type - Port type ('input', 'output', 'both')
   * @param {string} direction - Port direction
   * @returns {ShapeBuilder}
   */
  addPort(id, x, y, type = "both", direction = "any") {
    this.config.ports.push({ id, x, y, type, direction });
    return this;
  }

  /**
   * Add multiple ports
   * @param {Array} ports - Array of port objects
   * @returns {ShapeBuilder}
   */
  addPorts(ports) {
    this.config.ports.push(...ports);
    return this;
  }

  /**
   * Add standard 4-port configuration
   * @returns {ShapeBuilder}
   */
  addStandardPorts() {
    return this.addPort("top", 0.5, 0, "input", "top")
      .addPort("right", 1, 0.5, "output", "right")
      .addPort("bottom", 0.5, 1, "output", "bottom")
      .addPort("left", 0, 0.5, "input", "left");
  }

  /**
   * Enable/disable ports
   * @param {boolean} enabled - Ports enabled
   * @returns {ShapeBuilder}
   */
  enablePorts(enabled = true) {
    this.config.portsEnabled = enabled;
    return this;
  }

  /**
   * Add a resize handle
   * @param {string} handleId - Handle ID ('nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w')
   * @returns {ShapeBuilder}
   */
  addHandle(handleId) {
    if (!this.config.handles.includes(handleId)) {
      this.config.handles.push(handleId);
    }
    return this;
  }

  /**
   * Add multiple handles
   * @param {Array} handles - Array of handle IDs
   * @returns {ShapeBuilder}
   */
  addHandles(handles) {
    handles.forEach((h) => this.addHandle(h));
    return this;
  }

  /**
   * Add all corner and side handles
   * @returns {ShapeBuilder}
   */
  addAllHandles() {
    return this.addHandles(["nw", "n", "ne", "e", "se", "s", "sw", "w"]);
  }

  /**
   * Add corner handles only
   * @returns {ShapeBuilder}
   */
  addCornerHandles() {
    return this.addHandles(["nw", "ne", "se", "sw"]);
  }

  /**
   * Enable/disable handles
   * @param {boolean} enabled - Handles enabled
   * @returns {ShapeBuilder}
   */
  enableHandles(enabled = true) {
    this.config.handlesEnabled = enabled;
    return this;
  }

  /**
   * Set size constraints
   * @param {Object} constraints - Constraint object
   * @returns {ShapeBuilder}
   */
  setConstraints(constraints) {
    Object.assign(this.config.constraints, constraints);
    return this;
  }

  /**
   * Set minimum size
   * @param {number} minWidth - Minimum width
   * @param {number} minHeight - Minimum height
   * @returns {ShapeBuilder}
   */
  setMinSize(minWidth, minHeight) {
    this.config.constraints.minWidth = minWidth;
    this.config.constraints.minHeight = minHeight;
    return this;
  }

  /**
   * Set maximum size
   * @param {number} maxWidth - Maximum width
   * @param {number} maxHeight - Maximum height
   * @returns {ShapeBuilder}
   */
  setMaxSize(maxWidth, maxHeight) {
    this.config.constraints.maxWidth = maxWidth;
    this.config.constraints.maxHeight = maxHeight;
    return this;
  }

  /**
   * Set aspect ratio constraint
   * @param {number} aspectRatio - Width/height ratio
   * @returns {ShapeBuilder}
   */
  setAspectRatio(aspectRatio) {
    this.config.constraints.aspectRatio = aspectRatio;
    return this;
  }

  /**
   * Set feature flags
   * @param {Object} features - Feature object
   * @returns {ShapeBuilder}
   */
  setFeatures(features) {
    Object.assign(this.config.features, features);
    return this;
  }

  /**
   * Enable/disable resizable
   * @param {boolean} resizable - Resizable flag
   * @returns {ShapeBuilder}
   */
  setResizable(resizable = true) {
    this.config.features.resizable = resizable;
    return this;
  }

  /**
   * Enable/disable rotatable
   * @param {boolean} rotatable - Rotatable flag
   * @returns {ShapeBuilder}
   */
  setRotatable(rotatable = true) {
    this.config.features.rotatable = rotatable;
    return this;
  }

  /**
   * Enable/disable connectable
   * @param {boolean} connectable - Connectable flag
   * @returns {ShapeBuilder}
   */
  setConnectable(connectable = true) {
    this.config.features.connectable = connectable;
    return this;
  }

  /**
   * Set locked state
   * @param {boolean} locked - Locked flag
   * @returns {ShapeBuilder}
   */
  setLocked(locked = true) {
    this.config.locked = locked;
    return this;
  }

  /**
   * Set visible state
   * @param {boolean} visible - Visible flag
   * @returns {ShapeBuilder}
   */
  setVisible(visible = true) {
    this.config.visible = visible;
    return this;
  }

  /**
   * Set custom data
   * @param {Object} data - Custom data object
   * @returns {ShapeBuilder}
   */
  setData(data) {
    Object.assign(this.config.data, data);
    return this;
  }

  /**
   * Set a custom data property
   * @param {string} key - Property key
   * @param {*} value - Property value
   * @returns {ShapeBuilder}
   */
  setDataProperty(key, value) {
    this.config.data[key] = value;
    return this;
  }

  /**
   * Load configuration from preset
   * @param {string} presetId - Preset identifier
   * @returns {ShapeBuilder}
   */
  fromPreset(presetId) {
    // This would load from preset files
    // Implementation depends on preset loading system
    return this;
  }

  /**
   * Load configuration from template
   * @param {Object} template - Template object
   * @returns {ShapeBuilder}
   */
  fromTemplate(template) {
    Object.assign(this.config, template);
    return this;
  }

  /**
   * Get the current configuration
   * @returns {Object}
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Build the shape instance
   * @returns {BaseShape}
   */
  build() {
    if (!this.shapeRegistry) {
      throw new Error(
        "ShapeRegistry required to build shape. Pass registry to constructor."
      );
    }

    const ShapeClass = this.shapeRegistry.getShape(this.config.type);
    if (!ShapeClass) {
      throw new Error(`Shape type '${this.config.type}' not found in registry`);
    }

    return new ShapeClass(this.config);
  }

  /**
   * Build without registry (returns config)
   * Useful for serialization or when registry not available
   * @returns {Object}
   */
  buildConfig() {
    return this.getConfig();
  }

  /**
   * Reset builder to initial state
   * @returns {ShapeBuilder}
   */
  reset() {
    const type = this.config.type;
    this.config = {
      type,
      style: {},
      textStyle: {},
      ports: [],
      handles: [],
      constraints: {},
      features: {},
      data: {},
    };
    return this;
  }

  /**
   * Clone the builder with current config
   * @returns {ShapeBuilder}
   */
  clone() {
    const builder = new ShapeBuilder(this.config.type, this.shapeRegistry);
    builder.config = JSON.parse(JSON.stringify(this.config));
    return builder;
  }
}

/**
 * Create a new shape builder
 * Helper function for cleaner syntax
 *
 * @param {string} type - Shape type
 * @param {Object} shapeRegistry - Shape registry
 * @returns {ShapeBuilder}
 *
 * @example
 * const rect = createShape('rect', registry)
 *   .setPosition(100, 100)
 *   .setSize(200, 150)
 *   .build();
 */
export function createShape(type, shapeRegistry) {
  return new ShapeBuilder(type, shapeRegistry);
}
