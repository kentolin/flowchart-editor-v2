/**
 * validation.js - Data validation utilities
 */

export class ValidationUtils {
  /**
   * Validate node data structure
   */
  static validateNode(node) {
    const errors = [];

    if (!node.id) errors.push("Node must have an id");
    if (!node.type) errors.push("Node must have a type");
    if (typeof node.x !== "number") errors.push("Node x must be a number");
    if (typeof node.y !== "number") errors.push("Node y must be a number");
    if (node.width && node.width <= 0)
      errors.push("Node width must be positive");
    if (node.height && node.height <= 0)
      errors.push("Node height must be positive");

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate edge data structure
   */
  static validateEdge(edge) {
    const errors = [];

    if (!edge.id) errors.push("Edge must have an id");
    if (!edge.sourceId) errors.push("Edge must have a sourceId");
    if (!edge.targetId) errors.push("Edge must have a targetId");
    if (edge.sourceId === edge.targetId)
      errors.push("Self-loops are not allowed");

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate color string (hex, rgb, rgba, named)
   */
  static validateColor(color) {
    if (!color) return false;

    // Hex color
    if (/^#([0-9A-F]{3}){1,2}$/i.test(color)) return true;

    // RGB/RGBA
    if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/i.test(color))
      return true;

    // Named colors
    const namedColors = [
      "red",
      "blue",
      "green",
      "yellow",
      "black",
      "white",
      "transparent",
    ];
    if (namedColors.includes(color.toLowerCase())) return true;

    return false;
  }

  /**
   * Validate number range
   */
  static validateRange(value, min, max) {
    return typeof value === "number" && value >= min && value <= max;
  }

  /**
   * Validate email format
   */
  static validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Validate URL format
   */
  static validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate required fields
   */
  static validateRequired(obj, fields) {
    const missing = [];

    fields.forEach((field) => {
      if (
        !(field in obj) ||
        obj[field] === null ||
        obj[field] === undefined ||
        obj[field] === ""
      ) {
        missing.push(field);
      }
    });

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Validate object against schema
   */
  static validateSchema(obj, schema) {
    const errors = [];

    for (const [key, rules] of Object.entries(schema)) {
      const value = obj[key];

      if (rules.required && (value === undefined || value === null)) {
        errors.push(`${key} is required`);
        continue;
      }

      if (value !== undefined && value !== null) {
        if (rules.type && typeof value !== rules.type) {
          errors.push(`${key} must be of type ${rules.type}`);
        }

        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${key} must be at least ${rules.min}`);
        }

        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${key} must be at most ${rules.max}`);
        }

        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${key} does not match required pattern`);
        }

        if (rules.validator && !rules.validator(value)) {
          errors.push(`${key} failed custom validation`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize string (remove HTML tags)
   */
  static sanitizeString(str) {
    return str.replace(/<[^>]*>/g, "");
  }

  /**
   * Validate JSON string
   */
  static validateJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if value is empty
   */
  static isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === "string") return value.trim() === "";
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "object") return Object.keys(value).length === 0;
    return false;
  }

  /**
   * Validate file size
   */
  static validateFileSize(file, maxSizeInMB) {
    const maxBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxBytes;
  }

  /**
   * Validate file type
   */
  static validateFileType(file, allowedTypes) {
    return allowedTypes.includes(file.type);
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  static validateDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * Validate port number
   */
  static validatePort(port) {
    return Number.isInteger(port) && port >= 0 && port <= 65535;
  }

  /**
   * Validate coordinates
   */
  static validateCoordinates(x, y) {
    return (
      typeof x === "number" &&
      typeof y === "number" &&
      !isNaN(x) &&
      !isNaN(y) &&
      isFinite(x) &&
      isFinite(y)
    );
  }

  /**
   * Validate dimensions
   */
  static validateDimensions(width, height) {
    return (
      typeof width === "number" &&
      typeof height === "number" &&
      width > 0 &&
      height > 0 &&
      isFinite(width) &&
      isFinite(height)
    );
  }
}
