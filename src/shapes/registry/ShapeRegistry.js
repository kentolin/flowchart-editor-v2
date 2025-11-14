/**
 * ShapeRegistry.js - Central Shape Registry
 *
 * Manages registration, lookup, and instantiation of all shape types.
 * Acts as a factory for creating shape instances.
 *
 * @module shapes/registry/ShapeRegistry
 */

export class ShapeRegistry {
  constructor() {
    // Map of shape type -> shape class
    this.shapes = new Map();

    // Map of shape type -> shape definition (config)
    this.definitions = new Map();

    // Map of category -> Set of shape types
    this.categories = new Map();

    // Map of tag -> Set of shape types
    this.tags = new Map();
  }

  /**
   * Register a shape class with its definition
   * @param {string} type - Shape type identifier (e.g., 'flowchart-process')
   * @param {Class} ShapeClass - Shape class constructor
   * @param {Object} definition - Shape definition/config
   */
  register(type, ShapeClass, definition) {
    if (this.shapes.has(type)) {
      console.warn(`Shape type '${type}' is already registered. Overwriting.`);
    }

    // Validate inputs
    if (!type || typeof type !== "string") {
      throw new Error("Shape type must be a non-empty string");
    }

    if (typeof ShapeClass !== "function") {
      throw new Error("ShapeClass must be a constructor function");
    }

    if (!definition || typeof definition !== "object") {
      throw new Error("Definition must be an object");
    }

    // Register shape class
    this.shapes.set(type, ShapeClass);

    // Register definition
    this.definitions.set(type, definition);

    // Register by category
    if (definition.category) {
      if (!this.categories.has(definition.category)) {
        this.categories.set(definition.category, new Set());
      }
      this.categories.get(definition.category).add(type);
    }

    // Register by tags
    if (definition.tags && Array.isArray(definition.tags)) {
      definition.tags.forEach((tag) => {
        if (!this.tags.has(tag)) {
          this.tags.set(tag, new Set());
        }
        this.tags.get(tag).add(type);
      });
    }
  }

  /**
   * Unregister a shape type
   * @param {string} type - Shape type to unregister
   * @returns {boolean} - True if shape was unregistered
   */
  unregister(type) {
    if (!this.shapes.has(type)) {
      return false;
    }

    const definition = this.definitions.get(type);

    // Remove from category
    if (definition.category) {
      const categorySet = this.categories.get(definition.category);
      if (categorySet) {
        categorySet.delete(type);
        if (categorySet.size === 0) {
          this.categories.delete(definition.category);
        }
      }
    }

    // Remove from tags
    if (definition.tags && Array.isArray(definition.tags)) {
      definition.tags.forEach((tag) => {
        const tagSet = this.tags.get(tag);
        if (tagSet) {
          tagSet.delete(type);
          if (tagSet.size === 0) {
            this.tags.delete(tag);
          }
        }
      });
    }

    // Remove shape
    this.shapes.delete(type);
    this.definitions.delete(type);

    return true;
  }

  /**
   * Create a shape instance
   * @param {string} type - Shape type
   * @param {Object} options - Shape options
   * @returns {BaseShape} - Shape instance
   */
  create(type, options = {}) {
    const ShapeClass = this.shapes.get(type);

    if (!ShapeClass) {
      throw new Error(`Shape type '${type}' is not registered`);
    }

    // Get definition for default values
    const definition = this.definitions.get(type);

    // Merge options with defaults from definition
    const mergedOptions = {
      type,
      ...definition.defaultSize,
      ...definition.defaultStyle,
      ...options,
    };

    // Create and return shape instance
    return new ShapeClass(mergedOptions);
  }

  /**
   * Check if a shape type is registered
   * @param {string} type - Shape type
   * @returns {boolean}
   */
  has(type) {
    return this.shapes.has(type);
  }

  /**
   * Get shape class for a type
   * @param {string} type - Shape type
   * @returns {Class|null}
   */
  getShapeClass(type) {
    return this.shapes.get(type) || null;
  }

  /**
   * Get shape definition for a type
   * @param {string} type - Shape type
   * @returns {Object|null}
   */
  getDefinition(type) {
    return this.definitions.get(type) || null;
  }

  /**
   * Get all registered shape types
   * @returns {string[]}
   */
  getTypes() {
    return Array.from(this.shapes.keys());
  }

  /**
   * Get all shape types in a category
   * @param {string} category - Category name
   * @returns {string[]}
   */
  getTypesByCategory(category) {
    const categorySet = this.categories.get(category);
    return categorySet ? Array.from(categorySet) : [];
  }

  /**
   * Get all shape types with a specific tag
   * @param {string} tag - Tag name
   * @returns {string[]}
   */
  getTypesByTag(tag) {
    const tagSet = this.tags.get(tag);
    return tagSet ? Array.from(tagSet) : [];
  }

  /**
   * Get all categories
   * @returns {string[]}
   */
  getCategories() {
    return Array.from(this.categories.keys());
  }

  /**
   * Get all tags
   * @returns {string[]}
   */
  getTags() {
    return Array.from(this.tags.keys());
  }

  /**
   * Get all shapes in a category with their definitions
   * @param {string} category - Category name
   * @returns {Array<Object>}
   */
  getCategoryShapes(category) {
    const types = this.getTypesByCategory(category);

    return types.map((type) => ({
      type,
      definition: this.definitions.get(type),
      class: this.shapes.get(type),
    }));
  }

  /**
   * Search shapes by name or tags
   * @param {string} query - Search query
   * @returns {Array<Object>}
   */
  search(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    this.definitions.forEach((definition, type) => {
      // Check name
      if (
        definition.name &&
        definition.name.toLowerCase().includes(lowerQuery)
      ) {
        results.push({ type, definition, score: 10 });
        return;
      }

      // Check description
      if (
        definition.description &&
        definition.description.toLowerCase().includes(lowerQuery)
      ) {
        results.push({ type, definition, score: 5 });
        return;
      }

      // Check tags
      if (
        definition.tags &&
        definition.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      ) {
        results.push({ type, definition, score: 3 });
        return;
      }

      // Check type
      if (type.toLowerCase().includes(lowerQuery)) {
        results.push({ type, definition, score: 1 });
      }
    });

    // Sort by score (highest first)
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Get registry statistics
   * @returns {Object}
   */
  getStats() {
    const stats = {
      totalShapes: this.shapes.size,
      categories: {},
      tags: {},
    };

    // Count by category
    this.categories.forEach((types, category) => {
      stats.categories[category] = types.size;
    });

    // Count by tag
    this.tags.forEach((types, tag) => {
      stats.tags[tag] = types.size;
    });

    return stats;
  }

  /**
   * Validate a shape type exists and can be created
   * @param {string} type - Shape type
   * @returns {Object} - Validation result
   */
  validate(type) {
    if (!this.has(type)) {
      return {
        valid: false,
        error: `Shape type '${type}' is not registered`,
      };
    }

    const ShapeClass = this.shapes.get(type);
    const definition = this.definitions.get(type);

    // Check if class is a function
    if (typeof ShapeClass !== "function") {
      return {
        valid: false,
        error: `Shape class for '${type}' is not a constructor`,
      };
    }

    // Check if definition has required fields
    if (!definition.name) {
      return {
        valid: false,
        error: `Shape definition for '${type}' missing required field: name`,
      };
    }

    return {
      valid: true,
      type,
      definition,
    };
  }

  /**
   * Get all shape definitions (for UI shape picker)
   * @returns {Array<Object>}
   */
  getAllDefinitions() {
    return Array.from(this.definitions.entries()).map(([type, definition]) => ({
      type,
      ...definition,
    }));
  }

  /**
   * Get shape palette data (organized by category)
   * @returns {Object}
   */
  getPaletteData() {
    const palette = {};

    this.categories.forEach((types, category) => {
      palette[category] = Array.from(types).map((type) => {
        const definition = this.definitions.get(type);
        return {
          type,
          name: definition.name,
          description: definition.description,
          icon: definition.icon,
          category: definition.category,
        };
      });
    });

    return palette;
  }

  /**
   * Clear all registered shapes
   */
  clear() {
    this.shapes.clear();
    this.definitions.clear();
    this.categories.clear();
    this.tags.clear();
  }

  /**
   * Export registry as JSON (for debugging/inspection)
   * @returns {Object}
   */
  toJSON() {
    return {
      types: this.getTypes(),
      categories: Object.fromEntries(
        Array.from(this.categories.entries()).map(([cat, types]) => [
          cat,
          Array.from(types),
        ])
      ),
      tags: Object.fromEntries(
        Array.from(this.tags.entries()).map(([tag, types]) => [
          tag,
          Array.from(types),
        ])
      ),
      definitions: Object.fromEntries(this.definitions),
    };
  }
}
