/**
 * ShapeValidator.js - Shape Definition and Instance Validator
 *
 * Validates shape classes, configurations, and instances.
 * Ensures shapes meet requirements before registration/creation.
 *
 * @module shapes/loader/ShapeValidator
 */

export class ShapeValidator {
  constructor(options = {}) {
    this.strict = options.strict || false;
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate shape class
   * @param {Function} ShapeClass - Shape constructor
   * @returns {Object} - Validation result
   */
  validateClass(ShapeClass) {
    this.errors = [];
    this.warnings = [];

    // Check if it's a function
    if (typeof ShapeClass !== "function") {
      this.errors.push("Shape class must be a constructor function");
      return this._result();
    }

    // Check required methods
    const requiredMethods = ["render", "getPath", "serialize", "deserialize"];
    const prototype = ShapeClass.prototype;

    requiredMethods.forEach((method) => {
      if (typeof prototype[method] !== "function") {
        this.errors.push(`Missing required method: ${method}`);
      }
    });

    // Check optional but recommended methods
    const recommendedMethods = ["containsPoint", "getPortPositions"];
    recommendedMethods.forEach((method) => {
      if (typeof prototype[method] !== "function") {
        this.warnings.push(`Missing recommended method: ${method}`);
      }
    });

    return this._result();
  }

  /**
   * Validate shape configuration
   * @param {Object} config - Shape config object
   * @returns {Object} - Validation result
   */
  validateConfig(config) {
    this.errors = [];
    this.warnings = [];

    if (!config || typeof config !== "object") {
      this.errors.push("Config must be an object");
      return this._result();
    }

    // Required fields
    const required = ["id", "name", "category"];
    required.forEach((field) => {
      if (!config[field]) {
        this.errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate id format
    if (config.id && !/^[a-z0-9-]+$/.test(config.id)) {
      this.errors.push(
        "ID must contain only lowercase letters, numbers, and hyphens"
      );
    }

    // Validate category
    const validCategories = [
      "basic",
      "flowchart",
      "network",
      "uml",
      "containers",
      "arrows",
      "text",
      "custom",
    ];
    if (config.category && !validCategories.includes(config.category)) {
      this.warnings.push(`Unknown category: ${config.category}`);
    }

    // Validate defaultSize
    if (config.defaultSize) {
      if (
        typeof config.defaultSize.width !== "number" ||
        config.defaultSize.width <= 0
      ) {
        this.errors.push("defaultSize.width must be a positive number");
      }
      if (
        typeof config.defaultSize.height !== "number" ||
        config.defaultSize.height <= 0
      ) {
        this.errors.push("defaultSize.height must be a positive number");
      }
    } else {
      this.warnings.push("Missing defaultSize");
    }

    // Validate defaultStyle
    if (config.defaultStyle) {
      if (typeof config.defaultStyle !== "object") {
        this.errors.push("defaultStyle must be an object");
      }
    } else {
      this.warnings.push("Missing defaultStyle");
    }

    // Validate ports
    if (config.ports) {
      if (typeof config.ports.enabled !== "boolean") {
        this.warnings.push("ports.enabled should be a boolean");
      }
      if (config.ports.positions && !Array.isArray(config.ports.positions)) {
        this.errors.push("ports.positions must be an array");
      }
    }

    // Validate handles
    if (config.handles) {
      if (typeof config.handles.enabled !== "boolean") {
        this.warnings.push("handles.enabled should be a boolean");
      }
      if (
        config.handles.positions &&
        !Array.isArray(config.handles.positions)
      ) {
        this.errors.push("handles.positions must be an array");
      }
    }

    // Validate constraints
    if (config.constraints) {
      const c = config.constraints;
      if (c.minWidth && c.maxWidth && c.minWidth > c.maxWidth) {
        this.errors.push("minWidth cannot be greater than maxWidth");
      }
      if (c.minHeight && c.maxHeight && c.minHeight > c.maxHeight) {
        this.errors.push("minHeight cannot be greater than maxHeight");
      }
      if (c.aspectRatio !== null && typeof c.aspectRatio !== "number") {
        this.errors.push("aspectRatio must be a number or null");
      }
    }

    // Validate features
    if (config.features) {
      const booleanFeatures = [
        "resizable",
        "rotatable",
        "connectable",
        "groupable",
        "lockable",
        "clonable",
      ];
      booleanFeatures.forEach((feature) => {
        if (
          config.features[feature] !== undefined &&
          typeof config.features[feature] !== "boolean"
        ) {
          this.errors.push(`features.${feature} must be a boolean`);
        }
      });
    }

    // Validate tags
    if (config.tags && !Array.isArray(config.tags)) {
      this.errors.push("tags must be an array");
    }

    return this._result();
  }

  /**
   * Validate shape instance
   * @param {Object} shape - Shape instance
   * @returns {Object} - Validation result
   */
  validateInstance(shape) {
    this.errors = [];
    this.warnings = [];

    if (!shape || typeof shape !== "object") {
      this.errors.push("Shape instance must be an object");
      return this._result();
    }

    // Check required properties
    if (!shape.id) {
      this.errors.push("Shape instance must have an id");
    }

    if (!shape.type) {
      this.errors.push("Shape instance must have a type");
    }

    if (typeof shape.x !== "number") {
      this.errors.push("Shape x position must be a number");
    }

    if (typeof shape.y !== "number") {
      this.errors.push("Shape y position must be a number");
    }

    // Check required methods
    const requiredMethods = ["render", "getPath", "serialize"];
    requiredMethods.forEach((method) => {
      if (typeof shape[method] !== "function") {
        this.errors.push(`Missing required method: ${method}`);
      }
    });

    return this._result();
  }

  /**
   * Validate complete shape registration
   * @param {string} type - Shape type
   * @param {Function} ShapeClass - Shape class
   * @param {Object} config - Shape config
   * @returns {Object} - Validation result
   */
  validateRegistration(type, ShapeClass, config) {
    this.errors = [];
    this.warnings = [];

    // Validate type
    if (!type || typeof type !== "string") {
      this.errors.push("Type must be a non-empty string");
    }

    // Validate class
    const classResult = this.validateClass(ShapeClass);
    this.errors.push(...classResult.errors);
    this.warnings.push(...classResult.warnings);

    // Validate config
    const configResult = this.validateConfig(config);
    this.errors.push(...configResult.errors);
    this.warnings.push(...configResult.warnings);

    // Check type matches config id
    if (type !== config.id) {
      this.warnings.push(
        `Type '${type}' does not match config id '${config.id}'`
      );
    }

    return this._result();
  }

  /**
   * Validate properties object
   * @param {Object} properties - Properties definition
   * @returns {Object} - Validation result
   */
  validateProperties(properties) {
    this.errors = [];
    this.warnings = [];

    if (!properties || typeof properties !== "object") {
      return this._result();
    }

    Object.entries(properties).forEach(([key, prop]) => {
      if (!prop.type) {
        this.errors.push(`Property '${key}' missing type`);
      }

      const validTypes = [
        "string",
        "number",
        "integer",
        "boolean",
        "color",
        "select",
      ];
      if (prop.type && !validTypes.includes(prop.type)) {
        this.warnings.push(`Property '${key}' has unknown type: ${prop.type}`);
      }

      if (prop.type === "number" || prop.type === "integer") {
        if (
          prop.min !== undefined &&
          prop.max !== undefined &&
          prop.min > prop.max
        ) {
          this.errors.push(`Property '${key}' min cannot be greater than max`);
        }
      }

      if (prop.type === "select" && !Array.isArray(prop.options)) {
        this.errors.push(
          `Property '${key}' with type 'select' must have options array`
        );
      }
    });

    return this._result();
  }

  /**
   * Get validation result
   * @private
   */
  _result() {
    return {
      valid: this.errors.length === 0,
      errors: [...this.errors],
      warnings: [...this.warnings],
    };
  }

  /**
   * Clear errors and warnings
   */
  clear() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Get all errors
   * @returns {Array}
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * Get all warnings
   * @returns {Array}
   */
  getWarnings() {
    return [...this.warnings];
  }

  /**
   * Check if has errors
   * @returns {boolean}
   */
  hasErrors() {
    return this.errors.length > 0;
  }

  /**
   * Check if has warnings
   * @returns {boolean}
   */
  hasWarnings() {
    return this.warnings.length > 0;
  }
}
