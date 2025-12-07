/**
 * ShapeDefinition.js - Shape metadata wrapper
 *
 * Simplified wrapper that holds both config.json data AND the shape class reference.
 * Used by NodeView to get shape rendering function and configuration.
 *
 * @module shapes/registry/ShapeDefinition
 */
export class ShapeDefinition {
  /**
   * Create a shape definition
   * @param {Object} config - Configuration from config.json
   * @param {Class} shapeClass - Shape class with static render() method
   */
  constructor(config, shapeClass = null) {
    // Basic info
    this.id = config.id;
    this.name = config.name;
    this.type = config.type || config.id;
    this.category = config.category || "basic";
    this.description = config.description || "";
    this.icon = config.icon || null;
    this.iconSvg = config.iconSvg || null;
    this.tags = config.tags || [];

    // Shape class reference
    this.shapeClass = shapeClass;

    // Default configuration
    this.defaultSize = {
      width: config.defaultSize?.width || 120,
      height: config.defaultSize?.height || 80,
    };

    this.defaultStyle = {
      fill: config.defaultStyle?.fill || "#ffffff",
      stroke: config.defaultStyle?.stroke || "#1976d2",
      strokeWidth: config.defaultStyle?.strokeWidth || 2,
      opacity: config.defaultStyle?.opacity || 1,
      ...config.defaultStyle,
    };

    // Ports configuration
    this.ports = {
      enabled: config.ports?.enabled !== false,
      preset: config.ports?.preset || null,
      positions: config.ports?.positions || [],
    };

    // Handles configuration
    this.handles = {
      enabled: config.handles?.enabled !== false,
      preset: config.handles?.preset || "all-corners-sides",
      positions: config.handles?.positions || [
        "nw",
        "n",
        "ne",
        "e",
        "se",
        "s",
        "sw",
        "w",
      ],
    };

    // Constraints
    this.constraints = {
      minWidth: config.constraints?.minWidth || 40,
      minHeight: config.constraints?.minHeight || 40,
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

    // Metadata
    this.metadata = {
      version: config.metadata?.version || "1.0.0",
      author: config.metadata?.author || "System",
      created: config.metadata?.created || new Date().toISOString(),
      updated: config.metadata?.updated || new Date().toISOString(),
      ...config.metadata,
    };
  }

  /**
   * Set shape class (called by ShapeLoader after loading)
   * @param {Class} shapeClass - Shape class constructor
   */
  setShapeClass(shapeClass) {
    this.shapeClass = shapeClass;
  }

  /**
   * Check if shape class is loaded
   * @returns {boolean}
   */
  isClassLoaded() {
    return this.shapeClass !== null && this.shapeClass !== undefined;
  }

  /**
   * Render shape (delegates to shape class)
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {Object} style - Style object
   * @returns {SVGElement} - Shape SVG element
   */
  render(width, height, style) {
    if (!this.isClassLoaded()) {
      throw new Error(`Shape class not loaded for type '${this.type}'`);
    }

    if (typeof this.shapeClass.render !== "function") {
      throw new Error(
        `Shape class '${this.type}' missing static render() method`
      );
    }

    return this.shapeClass.render(width, height, style);
  }

  /**
   * Get default configuration for creating nodes
   * @returns {Object}
   */
  getDefaultConfig() {
    return {
      type: this.type,
      name: this.name,
      category: this.category,
      width: this.defaultSize.width,
      height: this.defaultSize.height,
      style: { ...this.defaultStyle },
      ports: this.ports.positions.map((p) => ({ ...p })),
      portsEnabled: this.ports.enabled,
      handles: [...this.handles.positions],
      handlesEnabled: this.handles.enabled,
      constraints: { ...this.constraints },
      features: { ...this.features },
    };
  }

  /**
   * Get default ports or fallback to standard 4-port configuration
   * @returns {Array} - Array of port definitions
   */
  getDefaultPorts() {
    if (this.ports.positions && this.ports.positions.length > 0) {
      return this.ports.positions;
    }

    // Fallback to standard 4-port configuration
    return [
      { id: "top", x: 0.5, y: 0, type: "both", direction: "top" },
      { id: "right", x: 1, y: 0.5, type: "both", direction: "right" },
      { id: "bottom", x: 0.5, y: 1, type: "both", direction: "bottom" },
      { id: "left", x: 0, y: 0.5, type: "both", direction: "left" },
    ];
  }

  /**
   * Validate definition
   * @returns {Object} - {valid: boolean, errors: Array}
   */
  validate() {
    const errors = [];

    // Required fields
    if (!this.id) errors.push("Shape id is required");
    if (!this.name) errors.push("Shape name is required");
    if (!this.type) errors.push("Shape type is required");

    // Size validation
    if (this.defaultSize.width <= 0)
      errors.push("Default width must be positive");
    if (this.defaultSize.height <= 0)
      errors.push("Default height must be positive");

    // Constraint validation
    if (this.constraints.minWidth > this.constraints.maxWidth) {
      errors.push("minWidth cannot be greater than maxWidth");
    }
    if (this.constraints.minHeight > this.constraints.maxHeight) {
      errors.push("minHeight cannot be greater than maxHeight");
    }

    // Shape class validation
    if (!this.isClassLoaded()) {
      errors.push("Shape class not loaded");
    } else if (typeof this.shapeClass.render !== "function") {
      errors.push("Shape class missing static render() method");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      category: this.category,
      description: this.description,
      icon: this.icon,
      iconSvg: this.iconSvg,
      tags: [...this.tags],
      defaultSize: { ...this.defaultSize },
      defaultStyle: { ...this.defaultStyle },
      ports: {
        enabled: this.ports.enabled,
        preset: this.ports.preset,
        positions: this.ports.positions.map((p) => ({ ...p })),
      },
      handles: {
        enabled: this.handles.enabled,
        preset: this.handles.preset,
        positions: [...this.handles.positions],
      },
      constraints: { ...this.constraints },
      features: { ...this.features },
      metadata: { ...this.metadata },
      classLoaded: this.isClassLoaded(),
    };
  }

  /**
   * Get info for display (palette, inspector)
   * @returns {Object}
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      category: this.category,
      description: this.description,
      tags: this.tags,
      icon: this.icon,
      iconSvg: this.iconSvg,
      features: this.features,
    };
  }
}
