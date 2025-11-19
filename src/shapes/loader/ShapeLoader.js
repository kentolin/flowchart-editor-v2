import { DebugLogger } from "../../utils/debug/DebugLogger.js";
/**
 * ShapeLoader.js - Dynamic Shape Loader
 *
 * Loads shape classes and configurations dynamically.
 * Supports loading from built-in library and custom directories.
 *
 * @module shapes/loader/ShapeLoader
 */

export class ShapeLoader {
  constructor(shapeRegistry, options = {}) {
    this.log = DebugLogger.for(this);
    this.log.enter("constructor", { shapeRegistry, options });

    this.registry = shapeRegistry;

    // Configuration
    this.validateOnLoad = options.validateOnLoad !== false;
    this.throwOnError = options.throwOnError || false;

    // Tracking
    this.loaded = new Set();
    this.failed = new Map();
    this.loading = new Set();

    this.log.exit("constructor");
  }

  /**
   * Load a shape by type
   * @param {string} type - Shape type
   * @param {string} modulePath - Path to shape module
   * @param {string} configPath - Path to config JSON
   * @returns {Promise<boolean>}
   */
  async loadShape(type, modulePath, configPath) {
    this.log.enter("loadShape", { type, modulePath, configPath });

    // Check if already loaded
    if (this.loaded.has(type)) {
      this.log.warn(`Shape '${type}' is already loaded`);
      this.log.exit("loadShape", true);
      return true;
    }

    // Check if currently loading
    if (this.loading.has(type)) {
      this.log.warn(`Shape '${type}' is currently being loaded`);
      this.log.exit("loadShape", false);
      return false;
    }

    this.loading.add(type);

    try {
      // Load shape class
      this.log.debug(`Importing module for '${type}' from '${modulePath}'`);
      const shapeModule = await import(modulePath);
      const ShapeClass =
        shapeModule.default || shapeModule[this._getShapeClassName(type)];

      if (!ShapeClass) {
        throw new Error(`Shape class not found in module: ${modulePath}`);
      }

      // Load config
      this.log.debug(`Loading config for '${type}' from '${configPath}'`);
      const config = await this._loadConfig(configPath);

      // Validate if enabled
      if (this.validateOnLoad) {
        this.log.debug(`Validating shape '${type}'...`);
        this._validateShape(type, ShapeClass, config);
      }

      // Register with registry
      const success = this.registry.register(type, ShapeClass, config);
      if (!success) {
        throw new Error(`ShapeRegistry failed to register shape '${type}'`);
      }

      // Mark as loaded
      this.loaded.add(type);
      this.loading.delete(type);
      this.failed.delete(type); // Remove from failed list if it's a reload

      this.log.info(`Successfully loaded and registered shape '${type}'`);
      this.log.exit("loadShape", true);

      return true;
    } catch (error) {
      this.loading.delete(type);
      this.failed.set(type, error);

      this.log.error(`Failed to load shape '${type}':`, error);

      if (this.throwOnError) {
        throw error;
      }

      this.log.exit("loadShape", false);
      return false;
    }
  }

  /**
   * Load all shapes in a category
   * @param {string} category - Shape category
   * @param {Array} shapes - Array of shape definitions
   * @returns {Promise<Object>}
   */
  async loadCategory(category, shapes) {
    this.log.enter("loadCategory", { category, shapes });

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
        this.log.error(
          `Critical error loading shape '${shape.type}' in category '${category}'`,
          error
        );
        results.failed++;
        results.errors.push({ type: shape.type, error: error.message });
      }
    });

    await Promise.all(loadPromises);
    this.log.info(`Category '${category}' load complete`, results);
    this.log.exit("loadCategory", results);

    return results;
  }

  /**
   * Load shapes from a library configuration
   * @param {Object} libraryConfig - Library configuration object
   * @returns {Promise<Object>}
   */
  async loadLibrary(libraryConfig) {
    this.log.enter("loadLibrary", { libraryConfig });

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

      this.log.stage(`Loading category: '${category}'`);
      const categoryResult = await this.loadCategory(category, shapes);

      results.loaded += categoryResult.loaded;
      results.failed += categoryResult.failed;
      results.categories[category] = categoryResult;
    }

    this.log.info("Library load complete", results);
    this.log.exit("loadLibrary", results);
    return results;
  }

  /**
   * Load built-in shapes (basic, flowchart, network, etc.)
   * @param {string} basePath - Base path to shapes library
   * @returns {Promise<Object>}
   */
  async loadBuiltInShapes(basePath = "/src/shapes/library") {
    this.log.enter("loadBuiltInShapes", { basePath });

    // This config object just defines the library structure
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

    const result = await this.loadLibrary(libraryConfig);
    this.log.exit("loadBuiltInShapes", result);
    return result;
  }

  /**
   * Load custom shapes from a specified directory
   * @param {string} customPath - Path to custom shapes directory
   * @returns {Promise<Object>}
   */
  async loadCustomShapes(customPath) {
    this.log.enter("loadCustomShapes", { customPath });
    // This would scan the custom directory and load shapes
    // For now, return empty result
    this.log.info("loadCustomShapes not implemented, returning empty result");
    const result = {
      category: "custom",
      total: 0,
      loaded: 0,
      failed: 0,
      errors: [],
    };
    this.log.exit("loadCustomShapes", result);
    return result;
  }

  /**
   * Reload a shape by type
   * @param {string} type - Shape type
   * @param {string} modulePath - Path to shape module
   * @param {string} configPath - Path to config JSON
   * @returns {Promise<boolean>}
   */
  async reloadShape(type, modulePath, configPath) {
    this.log.enter("reloadShape", { type, modulePath, configPath });
    this.log.warn(`Reloading shape '${type}'`);
    // Unregister existing shape
    this.registry.unregister(type);
    this.loaded.delete(type);
    this.failed.delete(type);

    // Load again
    const result = await this.loadShape(type, modulePath, configPath);
    this.log.exit("reloadShape", result);
    return result;
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
   * Get loading error for a shape
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
   * Load shape config JSON
   * @param {string} configPath - Path to config JSON
   * @returns {Promise<Object>}
   * @private
   */
  async _loadConfig(configPath) {
    this.log.enter("_loadConfig", { configPath });

    try {
      // For JSON files, we need to fetch and parse
      const response = await fetch(configPath);

      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.statusText}`);
      }

      const config = await response.json();
      this.log.exit("_loadConfig", config);
      return config;
    } catch (error) {
      this.log.warn(
        `Fetch config failed for ${configPath}, trying import...`,
        error
      );
      // Try dynamic import as fallback
      try {
        const configModule = await import(configPath, {
          assert: { type: "json" },
        });
        const config = configModule.default;
        this.log.exit("_loadConfig", config);
        return config;
      } catch (importError) {
        this.log.error(`Failed to load config from ${configPath}`, importError);
        throw new Error(
          `Failed to load config from ${configPath}: ${importError.message}`
        );
      }
    }
  }

  /**
   * Validate shape definition
   * @param {string} type - Shape type
   * @param {Function} ShapeClass - Shape class constructor
   * @param {Object} config - Shape configuration object
   * @return {boolean}
   * @private
   */
  _validateShape(type, ShapeClass, config) {
    this.log.enter("_validateShape", { type, ShapeClass, config });

    // Check shape class
    if (typeof ShapeClass !== "function") {
      this.log.error(
        `Validation Failed: Shape class must be a constructor function`
      );
      throw new Error(`Shape class must be a constructor function`);
    }

    // Check config has required fields
    const requiredFields = ["id", "name", "category"];

    for (const field of requiredFields) {
      if (!config[field]) {
        this.log.error(
          `Validation Failed: Config missing required field: ${field}`
        );
        throw new Error(`Config missing required field: ${field}`);
      }
    }

    // Check type matches config id
    if (config.id !== type) {
      this.log.warn(
        `Shape type '${type}' does not match config id '${config.id}'`
      );
    }

    // Validate defaultSize
    if (config.defaultSize) {
      if (
        typeof config.defaultSize.width !== "number" ||
        typeof config.defaultSize.height !== "number"
      ) {
        this.log.error(
          `Validation Failed: defaultSize must have numeric width and height`
        );
        throw new Error(`defaultSize must have numeric width and height`);
      }
    }

    // Validate defaultStyle
    if (config.defaultStyle) {
      if (typeof config.defaultStyle !== "object") {
        this.log.error(`Validation Failed: defaultStyle must be an object`);
        throw new Error(`defaultStyle must be an object`);
      }
    }

    this.log.exit("_validateShape", true);
    return true;
  }

  /**
   * Get shape class name from type
   * @param {string} type - Shape type
   * @returns {string}
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
    this.log.enter("clear");
    this.loaded.clear();
    this.failed.clear();
    this.loading.clear();
    this.log.warn("ShapeLoader state cleared");
    this.log.exit("clear");
  }

  /**
   * Serialize loader state to JSON
   * @returns {Object}
   *
   */
  toJSON() {
    this.log.enter("toJSON");
    const json = {
      loaded: Array.from(this.loaded),
      failed: Array.from(this.failed.entries()).map(([type, error]) => ({
        type,
        error: error.message,
      })),
      loading: Array.from(this.loading),
      stats: this.getStats(),
    };
    this.log.exit("toJSON", json);
    return json;
  }
}
