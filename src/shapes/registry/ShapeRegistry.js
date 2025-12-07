import { DebugLogger } from "../../utils/debug/DebugLogger.js";

/**
 * ShapeRegistry.js - Central Shape Registry
 *
 * Stores ShapeDefinition objects (which contain both config and shape class).
 * Provides lookup by type, category, tags.
 *
 * @module shapes/registry/ShapeRegistry
 */
export class ShapeRegistry {
  constructor() {
    this.log = DebugLogger.for(this);
    this.log.enter("constructor");

    // Map of shape type -> ShapeDefinition
    this.definitions = new Map();

    // Map of category -> Set of shape types
    this.categories = new Map();

    // Map of tag -> Set of shape types
    this.tags = new Map();

    this.log.exit("constructor");
  }

  /**
   * Register a shape definition
   * @param {string} type - Shape type identifier (e.g., 'basic-rect')
   * @param {ShapeDefinition} shapeDefinition - Shape definition object
   * @returns {boolean} - Success
   */
  register(type, shapeDefinition) {
    this.log.enter("register", { type });

    if (this.definitions.has(type)) {
      this.log.warn(`Shape type '${type}' already registered. Overwriting.`);
    }

    // Validate inputs
    if (!type || typeof type !== "string") {
      this.log.error("Shape type must be a non-empty string");
      this.log.exit("register", false);
      return false;
    }

    if (!shapeDefinition || typeof shapeDefinition !== "object") {
      this.log.error("ShapeDefinition must be an object");
      this.log.exit("register", false);
      return false;
    }

    // Register definition
    this.definitions.set(type, shapeDefinition);

    // Register by category
    if (shapeDefinition.category) {
      if (!this.categories.has(shapeDefinition.category)) {
        this.categories.set(shapeDefinition.category, new Set());
      }
      this.categories.get(shapeDefinition.category).add(type);
    }

    // Register by tags
    if (shapeDefinition.tags && Array.isArray(shapeDefinition.tags)) {
      shapeDefinition.tags.forEach((tag) => {
        if (!this.tags.has(tag)) {
          this.tags.set(tag, new Set());
        }
        this.tags.get(tag).add(type);
      });
    }

    this.log.info(`Registered shape '${type}'`, {
      category: shapeDefinition.category,
      classLoaded: shapeDefinition.isClassLoaded(),
    });
    this.log.exit("register", true);
    return true;
  }

  /**
   * Unregister a shape type
   * @param {string} type - Shape type
   * @returns {boolean}
   */
  unregister(type) {
    this.log.enter("unregister", { type });

    if (!this.definitions.has(type)) {
      this.log.warn(`Shape type '${type}' not found`);
      this.log.exit("unregister", false);
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

    // Remove definition
    this.definitions.delete(type);

    this.log.info(`Unregistered shape '${type}'`);
    this.log.exit("unregister", true);
    return true;
  }

  /**
   * Check if a shape type is registered
   * @param {string} type
   * @returns {boolean}
   */
  has(type) {
    return this.definitions.has(type);
  }

  /**
   * Get shape definition
   * @param {string} type
   * @returns {ShapeDefinition|null}
   */
  getDefinition(type) {
    return this.definitions.get(type) || null;
  }

  /**
   * Get all registered shape types
   * @returns {string[]}
   */
  getTypes() {
    return Array.from(this.definitions.keys());
  }

  /**
   * Get all shape types in a category
   * @param {string} category
   * @returns {string[]}
   */
  getTypesByCategory(category) {
    const categorySet = this.categories.get(category);
    return categorySet ? Array.from(categorySet) : [];
  }

  /**
   * Get all shape types with a specific tag
   * @param {string} tag
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
   * @param {string} category
   * @returns {Array<Object>}
   */
  getCategoryShapes(category) {
    const types = this.getTypesByCategory(category);
    return types.map((type) => ({
      type,
      definition: this.definitions.get(type),
    }));
  }

  /**
   * Search shapes by name or tags
   * @param {string} query
   * @returns {Array<Object>}
   */
  search(query) {
    this.log.enter("search", { query });

    const lowerQuery = query.toLowerCase();
    const results = [];

    this.definitions.forEach((definition, type) => {
      let score = 0;

      // Check name
      if (
        definition.name &&
        definition.name.toLowerCase().includes(lowerQuery)
      ) {
        score = 10;
      }
      // Check description
      else if (
        definition.description &&
        definition.description.toLowerCase().includes(lowerQuery)
      ) {
        score = 5;
      }
      // Check tags
      else if (
        definition.tags &&
        definition.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      ) {
        score = 3;
      }
      // Check type
      else if (type.toLowerCase().includes(lowerQuery)) {
        score = 1;
      }

      if (score > 0) {
        results.push({ type, definition, score });
      }
    });

    // Sort by score (highest first)
    const sortedResults = results.sort((a, b) => b.score - a.score);
    this.log.exit("search", sortedResults);
    return sortedResults;
  }

  /**
   * Get registry statistics
   * @returns {Object}
   */
  getStats() {
    this.log.enter("getStats");

    const stats = {
      totalShapes: this.definitions.size,
      categories: {},
      tags: {},
      loadedShapes: 0,
    };

    // Count by category
    this.categories.forEach((types, category) => {
      stats.categories[category] = types.size;
    });

    // Count by tag
    this.tags.forEach((types, tag) => {
      stats.tags[tag] = types.size;
    });

    // Count loaded shapes
    this.definitions.forEach((definition) => {
      if (definition.isClassLoaded()) {
        stats.loadedShapes++;
      }
    });

    this.log.exit("getStats", stats);
    return stats;
  }

  /**
   * Validate a shape type
   * @param {string} type
   * @returns {Object} - {valid: boolean, errors: Array}
   */
  validate(type) {
    this.log.enter("validate", { type });

    if (!this.has(type)) {
      const result = {
        valid: false,
        errors: [`Shape type '${type}' is not registered`],
      };
      this.log.warn(result.errors[0]);
      this.log.exit("validate", result);
      return result;
    }

    const definition = this.definitions.get(type);
    const validation = definition.validate();

    this.log.exit("validate", validation);
    return validation;
  }

  /**
   * Get all shape definitions
   * @returns {Array<Object>}
   */
  getAllDefinitions() {
    return Array.from(this.definitions.entries()).map(([type, definition]) => ({
      type,
      ...definition.toJSON(),
    }));
  }

  /**
   * Get shape palette data (organized by category)
   * @returns {Object}
   */
  getPaletteData() {
    this.log.enter("getPaletteData");

    const palette = {};

    this.categories.forEach((types, category) => {
      palette[category] = Array.from(types).map((type) => {
        const definition = this.definitions.get(type);
        return definition.getInfo();
      });
    });

    this.log.exit("getPaletteData", palette);
    return palette;
  }

  /**
   * Clear all registered shapes
   */
  clear() {
    this.log.enter("clear");
    this.definitions.clear();
    this.categories.clear();
    this.tags.clear();
    this.log.warn("Shape registry cleared");
    this.log.exit("clear");
  }

  /**
   * Export registry as JSON
   * @returns {Object}
   */
  toJSON() {
    this.log.enter("toJSON");
    const json = {
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
      stats: this.getStats(),
    };
    this.log.exit("toJSON", json);
    return json;
  }
}
