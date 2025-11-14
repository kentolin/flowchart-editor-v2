/**
 * ShapeValidator.js - Validates shape definitions and configurations
 *
 * Provides comprehensive validation for shape definitions,
 * configurations, and shape instances.
 *
 * @module shapes/loader/ShapeValidator
 */

export class ShapeValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate shape definition
   * @param {Object} definition - Shape definition object
   * @returns {Object} - {valid: boolean, errors: Array, warnings: Array}
   */
  validateDefinition(definition) {
    this.errors = [];
    this.warnings = [];

    // Required fields
    this._validateRequiredField(definition, "id", "string");
    this._validateRequiredField(definition, "name", "string");
    this._validateRequiredField(definition, "type", "string");

    // Optional but recommended fields
    if (!definition.category) {
      this.warnings.push('category is not specified, defaulting to "basic"');
    }
    if (!definition.description) {
      this.warnings.push("description is missing");
    }

    // Validate sizes
    if (definition.defaultSize) {
      this._validateSize(definition.defaultSize, "defaultSize");
    } else {
      this.warnings.push("defaultSize not specified, using defaults");
    }

    // Validate style
    if (definition.defaultStyle) {
      this._validateStyle(definition.defaultStyle);
    }

    // Validate ports
    if (definition.ports) {
      this._validatePorts(definition.ports);
    }

    // Validate handles
    if (definition.handles) {
      this._validateHandles(definition.handles);
    }

    // Validate constraints
    if (definition.constraints) {
      this._validateConstraints(definition.constraints);
    }

    // Validate features
    if (definition.features) {
      this._validateFeatures(definition.features);
    }

    return {
      valid: this.errors.length === 0,
      errors: [...this.errors],
      warnings: [...this.warnings],
    };
  }

  /**
   * Validate shape configuration
   * @param {Object} config - Shape config object
   * @returns {Object} - {valid: boolean, errors: Array, warnings: Array}
   */
  validateConfig(config) {
    this.errors = [];
    this.warnings = [];

    // Type is required
    if (!config.type) {
      this.errors.push("type is required");
    }

    // Validate position
    if (typeof config.x === "number" && typeof config.y === "number") {
      if (!isFinite(config.x) || !isFinite(config.y)) {
        this.errors.push("Position contains invalid values");
      }
    }

    // Validate size
    if (typeof config.width === "number" && typeof config.height === "number") {
      if (config.width <= 0 || config.height <= 0) {
        this.errors.push("Width and height must be positive");
      }
    }

    // Validate rotation
    if (typeof config.rotation === "number") {
      if (!isFinite(config.rotation)) {
        this.errors.push("Rotation contains invalid value");
      }
    }

    // Validate style
    if (config.style) {
      this._validateStyle(config.style);
    }

    // Validate ports
    if (config.ports && Array.isArray(config.ports)) {
      config.ports.forEach((port, index) => {
        this._validatePort(port, index);
      });
    }

    return {
      valid: this.errors.length === 0,
      errors: [...this.errors],
      warnings: [...this.warnings],
    };
  }

  /**
   * Validate shape instance
   * @param {BaseShape} shape - Shape instance
   * @returns {Object} - {valid: boolean, errors: Array, warnings: Array}
   */
  validateInstance(shape) {
    this.errors = [];
    this.warnings = [];

    // Check if it has required methods
    const requiredMethods = ["render", "getPath", "getBounds", "serialize"];
    requiredMethods.forEach((method) => {
      if (typeof shape[method] !== "function") {
        this.errors.push(`Shape missing required method: ${method}`);
      }
    });

    // Validate shape state
    if (!shape.id) {
      this.warnings.push("Shape has no id");
    }

    if (!shape.type) {
      this.errors.push("Shape has no type");
    }

    // Validate bounds
    const bounds = shape.getBounds();
    if (
      !bounds ||
      typeof bounds.x !== "number" ||
      typeof bounds.y !== "number"
    ) {
      this.errors.push("Shape getBounds() returns invalid data");
    }

    // Validate constraints
    if (shape.constraints) {
      if (shape.width < shape.constraints.minWidth) {
        this.errors.push(
          `Width ${shape.width} is less than minWidth ${shape.constraints.minWidth}`
        );
      }
      if (shape.height < shape.constraints.minHeight) {
        this.errors.push(
          `Height ${shape.height} is less than minHeight ${shape.constraints.minHeight}`
        );
      }
    }

    return {
      valid: this.errors.length === 0,
      errors: [...this.errors],
      warnings: [...this.warnings],
    };
  }

  /**
   * Validate JSON file
   * @param {Object} jsonData - Parsed JSON data
   * @returns {Object} - {valid: boolean, errors: Array, warnings: Array}
   */
  validateJSON(jsonData) {
    this.errors = [];
    this.warnings = [];

    if (typeof jsonData !== "object" || jsonData === null) {
      this.errors.push("Invalid JSON: must be an object");
      return {
        valid: false,
        errors: [...this.errors],
        warnings: [],
      };
    }

    return this.validateDefinition(jsonData);
  }

  /**
   * Validate required field
   * @private
   */
  _validateRequiredField(obj, field, expectedType) {
    if (!(field in obj)) {
      this.errors.push(`Required field '${field}' is missing`);
      return false;
    }

    if (expectedType && typeof obj[field] !== expectedType) {
      this.errors.push(`Field '${field}' must be of type ${expectedType}`);
      return false;
    }

    return true;
  }

  /**
   * Validate size object
   * @private
   */
  _validateSize(size, context = "size") {
    if (typeof size.width !== "number" || size.width <= 0) {
      this.errors.push(`${context}.width must be a positive number`);
    }
    if (typeof size.height !== "number" || size.height <= 0) {
      this.errors.push(`${context}.height must be a positive number`);
    }
  }

  /**
   * Validate style object
   * @private
   */
  _validateStyle(style) {
    // Validate colors
    if (style.fill && !this._isValidColor(style.fill)) {
      this.warnings.push(`fill color '${style.fill}' may be invalid`);
    }
    if (style.stroke && !this._isValidColor(style.stroke)) {
      this.warnings.push(`stroke color '${style.stroke}' may be invalid`);
    }

    // Validate stroke width
    if (typeof style.strokeWidth === "number" && style.strokeWidth < 0) {
      this.errors.push("strokeWidth must be non-negative");
    }

    // Validate opacity
    if (typeof style.opacity === "number") {
      if (style.opacity < 0 || style.opacity > 1) {
        this.errors.push("opacity must be between 0 and 1");
      }
    }
  }

  /**
   * Validate ports configuration
   * @private
   */
  _validatePorts(ports) {
    if (typeof ports.enabled !== "boolean") {
      this.warnings.push("ports.enabled should be boolean");
    }

    if (ports.positions && Array.isArray(ports.positions)) {
      ports.positions.forEach((port, index) => {
        this._validatePort(port, index);
      });
    }
  }

  /**
   * Validate single port
   * @private
   */
  _validatePort(port, index) {
    if (!port.id) {
      this.errors.push(`Port ${index} missing id`);
    }

    if (typeof port.x !== "number" || port.x < 0 || port.x > 1) {
      this.errors.push(`Port '${port.id || index}' x must be between 0 and 1`);
    }

    if (typeof port.y !== "number" || port.y < 0 || port.y > 1) {
      this.errors.push(`Port '${port.id || index}' y must be between 0 and 1`);
    }

    if (port.type && !["input", "output", "both"].includes(port.type)) {
      this.warnings.push(`Port '${port.id}' has unknown type '${port.type}'`);
    }
  }

  /**
   * Validate handles configuration
   * @private
   */
  _validateHandles(handles) {
    if (typeof handles.enabled !== "boolean") {
      this.warnings.push("handles.enabled should be boolean");
    }

    if (handles.positions && Array.isArray(handles.positions)) {
      const validHandles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
      handles.positions.forEach((handle) => {
        if (!validHandles.includes(handle)) {
          this.warnings.push(`Unknown handle position '${handle}'`);
        }
      });
    }
  }

  /**
   * Validate constraints
   * @private
   */
  _validateConstraints(constraints) {
    if (typeof constraints.minWidth === "number" && constraints.minWidth < 0) {
      this.errors.push("minWidth must be non-negative");
    }

    if (
      typeof constraints.minHeight === "number" &&
      constraints.minHeight < 0
    ) {
      this.errors.push("minHeight must be non-negative");
    }

    if (
      typeof constraints.maxWidth === "number" &&
      typeof constraints.minWidth === "number"
    ) {
      if (constraints.maxWidth < constraints.minWidth) {
        this.errors.push("maxWidth cannot be less than minWidth");
      }
    }

    if (
      typeof constraints.maxHeight === "number" &&
      typeof constraints.minHeight === "number"
    ) {
      if (constraints.maxHeight < constraints.minHeight) {
        this.errors.push("maxHeight cannot be less than minHeight");
      }
    }

    if (
      typeof constraints.aspectRatio === "number" &&
      constraints.aspectRatio <= 0
    ) {
      this.errors.push("aspectRatio must be positive");
    }
  }

  /**
   * Validate features
   * @private
   */
  _validateFeatures(features) {
    const validFeatures = [
      "resizable",
      "rotatable",
      "connectable",
      "groupable",
      "lockable",
      "clonable",
    ];

    Object.keys(features).forEach((key) => {
      if (!validFeatures.includes(key)) {
        this.warnings.push(`Unknown feature '${key}'`);
      }
      if (typeof features[key] !== "boolean") {
        this.warnings.push(`Feature '${key}' should be boolean`);
      }
    });
  }

  /**
   * Check if color value is valid
   * @private
   */
  _isValidColor(color) {
    // Basic color validation
    if (typeof color !== "string") return false;

    // Hex colors
    if (/^#([0-9A-F]{3}|[0-9A-F]{6}|[0-9A-F]{8})$/i.test(color)) return true;

    // RGB/RGBA
    if (/^rgba?\(/.test(color)) return true;

    // HSL/HSLA
    if (/^hsla?\(/.test(color)) return true;

    // Named colors (common ones)
    const namedColors = [
      "transparent",
      "white",
      "black",
      "red",
      "green",
      "blue",
      "yellow",
      "gray",
      "grey",
    ];
    if (namedColors.includes(color.toLowerCase())) return true;

    return false;
  }

  /**
   * Clear errors and warnings
   */
  clear() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Get validation summary
   * @returns {Object}
   */
  getSummary() {
    return {
      valid: this.errors.length === 0,
      errorCount: this.errors.length,
      warningCount: this.warnings.length,
      errors: [...this.errors],
      warnings: [...this.warnings],
    };
  }
}
