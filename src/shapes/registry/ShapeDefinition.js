/**
 * ShapeDefinition.js - Shape metadata and configuration
 *
 * Holds metadata about a shape including its configuration,
 * default values, and registration info.
 *
 * @module shapes/registry/ShapeDefinition
 */

export class ShapeDefinition {
  /**
   * Create a new shape definition
   * @param {Object} config - Shape definition configuration
   */
  constructor(config) {
    // Basic info
    this.id = config.id;
    this.name = config.name;
    this.type = config.type || config.id;
    this.category = config.category || "basic";
    this.description = config.description || "";
    this.icon = config.icon || null;
    this.tags = config.tags || [];

    // Shape class
    this.shapeClass = config.shapeClass || null;
    this.classPath = config.classPath || null;

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

    // Registration info
    this.registered = false;
    this.registeredAt = null;
  }

  /**
   * Get default configuration for creating this shape
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
   * Create a shape instance with custom config
   * @param {Object} customConfig - Custom configuration to merge
   * @returns {BaseShape}
   */
  createInstance(customConfig = {}) {
    if (!this.shapeClass) {
      throw new Error(`Shape class not loaded for type '${this.type}'`);
    }

    const config = {
      ...this.getDefaultConfig(),
      ...customConfig,
    };

    return new this.shapeClass(config);
  }

  /**
   * Set shape class
   * @param {Function} shapeClass - Shape class constructor
   */
  setShapeClass(shapeClass) {
    this.shapeClass = shapeClass;
  }

  /**
   * Check if shape class is loaded
   * @returns {boolean}
   */
  isClassLoaded() {
    return this.shapeClass !== null;
  }

  /**
   * Mark as registered
   */
  markAsRegistered() {
    this.registered = true;
    this.registeredAt = new Date().toISOString();
  }

  /**
   * Check if shape matches search criteria
   * @param {string} query - Search query
   * @returns {boolean}
   */
  matches(query) {
    const searchString = query.toLowerCase();

    return (
      this.id.toLowerCase().includes(searchString) ||
      this.name.toLowerCase().includes(searchString) ||
      this.category.toLowerCase().includes(searchString) ||
      this.description.toLowerCase().includes(searchString) ||
      this.tags.some((tag) => tag.toLowerCase().includes(searchString))
    );
  }

  /**
   * Check if shape is in category
   * @param {string} category - Category name
   * @returns {boolean}
   */
  isInCategory(category) {
    return this.category === category;
  }

  /**
   * Check if shape has tag
   * @param {string} tag - Tag name
   * @returns {boolean}
   */
  hasTag(tag) {
    return this.tags.includes(tag);
  }

  /**
   * Validate definition
   * @returns {Object} - {valid: boolean, errors: Array}
   */
  validate() {
    const errors = [];

    // Required fields
    if (!this.id) {
      errors.push("Shape id is required");
    }
    if (!this.name) {
      errors.push("Shape name is required");
    }
    if (!this.type) {
      errors.push("Shape type is required");
    }

    // Size validation
    if (this.defaultSize.width <= 0) {
      errors.push("Default width must be positive");
    }
    if (this.defaultSize.height <= 0) {
      errors.push("Default height must be positive");
    }

    // Constraint validation
    if (this.constraints.minWidth > this.constraints.maxWidth) {
      errors.push("minWidth cannot be greater than maxWidth");
    }
    if (this.constraints.minHeight > this.constraints.maxHeight) {
      errors.push("minHeight cannot be greater than maxHeight");
    }

    // Port validation
    if (this.ports.enabled && this.ports.positions.length === 0) {
      errors.push("Ports enabled but no port positions defined");
    }

    this.ports.positions.forEach((port, index) => {
      if (!port.id) {
        errors.push(`Port ${index} missing id`);
      }
      if (typeof port.x !== "number" || port.x < 0 || port.x > 1) {
        errors.push(`Port ${port.id || index} x must be between 0 and 1`);
      }
      if (typeof port.y !== "number" || port.y < 0 || port.y > 1) {
        errors.push(`Port ${port.id || index} y must be between 0 and 1`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  serialize() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      category: this.category,
      description: this.description,
      icon: this.icon,
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
      registered: this.registered,
      registeredAt: this.registeredAt,
    };
  }

  /**
   * Create from JSON
   * @param {Object} data - Serialized data
   * @returns {ShapeDefinition}
   */
  static deserialize(data) {
    return new ShapeDefinition(data);
  }

  /**
   * Clone definition
   * @returns {ShapeDefinition}
   */
  clone() {
    return ShapeDefinition.deserialize(this.serialize());
  }

  /**
   * Get info for display
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
      features: this.features,
      registered: this.registered,
    };
  }
}
