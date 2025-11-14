/**
 * ShapeLoader.js - Dynamic Shape Loader
 *
 * Loads shape classes and configurations dynamically.
 * Handles batch loading, validation, and error handling.
 *
 * @module shapes/loader/ShapeLoader
 */

export class ShapeLoader {
  constructor(shapeRegistry, options = {}) {
    this.registry = shapeRegistry;

    // Configuration
    this.validateOnLoad = options.validateOnLoad !== false;
    this.throwOnError = options.throwOnError || false;

    // Tracking
    this.loaded = new Set();
    this.failed = new Map();
    this.loading = new Set();
  }

  /**
   * Load a single shape
   * @param {string} type - Shape type identifier
   * @param {string} modulePath - Path to shape module
   * @param {string} configPath - Path to config JSON
   * @returns {Promise<boolean>}
   */
  async loadShape(type, modulePath, configPath) {
    // Check if already loaded
    if (this.loaded.has(type)) {
      console.warn(`Shape '${type}' is already loaded`);
      return true;
    }

    // Check if currently loading
    if (this.loading.has(type)) {
      console.warn(`Shape '${type}' is currently being loaded`);
      return false;
    }

    this.loading.add(type);

    try {
      // Load shape class
      const shapeModule = await import(modulePath);
      const ShapeClass =
        shapeModule.default || shapeModule[this._getShapeClassName(type)];

      if (!ShapeClass) {
        throw new Error(`Shape class not found in module: ${modulePath}`);
      }

      // Load config
      const config = await this._loadConfig(configPath);

      // Validate if enabled
      if (this.validateOnLoad) {
        this._validateShape(type, ShapeClass, config);
      }

      // Register with registry
      this.registry.register(type, ShapeClass, config);

      // Mark as loaded
      this.loaded.add(type);
      this.loading.delete(type);

      return true;
    } catch (error) {
      this.loading.delete(type);
      this.failed.set(type, error);

      console.error(`Failed to load shape '${type}':`, error);

      if (this.throwOnError) {
        throw error;
      }

      return false;
    }
  }

  /**
   * Load multiple shapes from a category
   * @param {string} category - Category name
   * @param {Array<Object>} shapes - Array of {type, modulePath, configPath}
   * @returns {Promise<Object>}
   */
  async loadCategory(category, shapes) {
    const results = {
      category,
      total: shapes.length,
      loaded: 0,
      failed: 0,
      errors: [],
    };

    const loadPromises = shapes.map(async (shape) => {
      try {
        const success = await this.loadShape(
          shape.type,
          shape.modulePath,
          shape.configPath
        );

        if (success) {
          results.loaded++;
        } else {
          results.failed++;
          results.errors.push({ type: shape.type, error: "Load failed" });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ type: shape.type, error: error.message });
      }
    });

    await Promise.all(loadPromises);

    return results;
  }

  /**
   * Load all shapes from library structure
   * @param {Object} libraryConfig - Library configuration
   * @returns {Promise<Object>}
   */
  async loadLibrary(libraryConfig) {
    const results = {
      totalCategories: 0,
      totalShapes: 0,
      loaded: 0,
      failed: 0,
      categories: {},
    };

    for (const [category, shapes] of Object.entries(libraryConfig)) {
      results.totalCategories++;
      results.totalShapes += shapes.length;

      const categoryResult = await this.loadCategory(category, shapes);

      results.loaded += categoryResult.loaded;
      results.failed += categoryResult.failed;
      results.categories[category] = categoryResult;
    }

    return results;
  }

  /**
   * Load built-in shapes (basic, flowchart, network, etc.)
   * @param {string} basePath - Base path to shapes library
   * @returns {Promise<Object>}
   */
  async loadBuiltInShapes(basePath = "./library") {
    const libraryConfig = {
      basic: [
        {
          type: "basic-circle",
          modulePath: `${basePath}/basic/circle/CircleShape.js`,
          configPath: `${basePath}/basic/circle/config.json`,
        },
        {
          type: "basic-rect",
          modulePath: `${basePath}/basic/rect/RectShape.js`,
          configPath: `${basePath}/basic/rect/config.json`,
        },
        {
          type: "basic-diamond",
          modulePath: `${basePath}/basic/diamond/DiamondShape.js`,
          configPath: `${basePath}/basic/diamond/config.json`,
        },
        {
          type: "basic-ellipse",
          modulePath: `${basePath}/basic/ellipse/EllipseShape.js`,
          configPath: `${basePath}/basic/ellipse/config.json`,
        },
        {
          type: "basic-triangle",
          modulePath: `${basePath}/basic/triangle/TriangleShape.js`,
          configPath: `${basePath}/basic/triangle/config.json`,
        },
      ],

      flowchart: [
        {
          type: "flowchart-process",
          modulePath: `${basePath}/flowchart/process/ProcessShape.js`,
          configPath: `${basePath}/flowchart/process/config.json`,
        },
        {
          type: "flowchart-decision",
          modulePath: `${basePath}/flowchart/decision/DecisionShape.js`,
          configPath: `${basePath}/flowchart/decision/config.json`,
        },
        {
          type: "flowchart-terminator",
          modulePath: `${basePath}/flowchart/terminator/TerminatorShape.js`,
          configPath: `${basePath}/flowchart/terminator/config.json`,
        },
        {
          type: "flowchart-data",
          modulePath: `${basePath}/flowchart/data/DataShape.js`,
          configPath: `${basePath}/flowchart/data/config.json`,
        },
        {
          type: "flowchart-document",
          modulePath: `${basePath}/flowchart/document/DocumentShape.js`,
          configPath: `${basePath}/flowchart/document/config.json`,
        },
      ],

      network: [
        {
          type: "network-server",
          modulePath: `${basePath}/network/server/ServerShape.js`,
          configPath: `${basePath}/network/server/config.json`,
        },
        {
          type: "network-router",
          modulePath: `${basePath}/network/router/RouterShape.js`,
          configPath: `${basePath}/network/router/config.json`,
        },
      ],
    };

    return await this.loadLibrary(libraryConfig);
  }

  /**
   * Load custom shapes from a directory
   * @param {string} customPath - Path to custom shapes directory
   * @returns {Promise<Object>}
   */
  async loadCustomShapes(customPath) {
    // This would scan the custom directory and load shapes
    // For now, return empty result
    return {
      category: "custom",
      total: 0,
      loaded: 0,
      failed: 0,
      errors: [],
    };
  }

  /**
   * Reload a shape (useful for development)
   * @param {string} type - Shape type
   * @param {string} modulePath - Path to shape module
   * @param {string} configPath - Path to config JSON
   * @returns {Promise<boolean>}
   */
  async reloadShape(type, modulePath, configPath) {
    // Unregister existing shape
    this.registry.unregister(type);
    this.loaded.delete(type);
    this.failed.delete(type);

    // Load again
    return await this.loadShape(type, modulePath, configPath);
  }

  /**
   * Check if a shape is loaded
   * @param {string} type - Shape type
   * @returns {boolean}
   */
  isLoaded(type) {
    return this.loaded.has(type);
  }

  /**
   * Check if a shape failed to load
   * @param {string} type - Shape type
   * @returns {Error|null}
   */
  getLoadError(type) {
    return this.failed.get(type) || null;
  }

  /**
   * Get list of loaded shape types
   * @returns {string[]}
   */
  getLoaded() {
    return Array.from(this.loaded);
  }

  /**
   * Get list of failed shape types
   * @returns {string[]}
   */
  getFailed() {
    return Array.from(this.failed.keys());
  }

  /**
   * Get loading statistics
   * @returns {Object}
   */
  getStats() {
    return {
      loaded: this.loaded.size,
      failed: this.failed.size,
      loading: this.loading.size,
      total: this.loaded.size + this.failed.size,
    };
  }

  /**
   * Load configuration file
   * @private
   */
  async _loadConfig(configPath) {
    try {
      // For JSON files, we need to fetch and parse
      const response = await fetch(configPath);

      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      // Try dynamic import as fallback
      try {
        const configModule = await import(configPath, {
          assert: { type: "json" },
        });
        return configModule.default;
      } catch (importError) {
        throw new Error(
          `Failed to load config from ${configPath}: ${error.message}`
        );
      }
    }
  }

  /**
   * Validate shape before loading
   * @private
   */
  _validateShape(type, ShapeClass, config) {
    // Check shape class
    if (typeof ShapeClass !== "function") {
      throw new Error(`Shape class must be a constructor function`);
    }

    // Check config has required fields
    const requiredFields = ["id", "name", "category"];

    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`Config missing required field: ${field}`);
      }
    }

    // Check type matches config id
    if (config.id !== type) {
      console.warn(
        `Shape type '${type}' does not match config id '${config.id}'`
      );
    }

    // Validate defaultSize
    if (config.defaultSize) {
      if (
        typeof config.defaultSize.width !== "number" ||
        typeof config.defaultSize.height !== "number"
      ) {
        throw new Error(`defaultSize must have numeric width and height`);
      }
    }

    // Validate defaultStyle
    if (config.defaultStyle) {
      if (typeof config.defaultStyle !== "object") {
        throw new Error(`defaultStyle must be an object`);
      }
    }

    return true;
  }

  /**
   * Get shape class name from type
   * @private
   */
  _getShapeClassName(type) {
    // Convert 'flowchart-process' to 'ProcessShape'
    const parts = type.split("-");
    const className = parts[parts.length - 1]
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");

    return `${className}Shape`;
  }

  /**
   * Clear loader state
   */
  clear() {
    this.loaded.clear();
    this.failed.clear();
    this.loading.clear();
  }

  /**
   * Get loader info as JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      loaded: Array.from(this.loaded),
      failed: Array.from(this.failed.entries()).map(([type, error]) => ({
        type,
        error: error.message,
      })),
      loading: Array.from(this.loading),
      stats: this.getStats(),
    };
  }
}
