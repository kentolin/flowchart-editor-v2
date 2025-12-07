import { DebugLogger } from "../../utils/debug/DebugLogger.js";
import { ShapeDefinition } from "../registry/ShapeDefinition.js";

/**
 * ShapeLoader.js - Dynamic Shape Loader
 *
 * Loads shape classes and config.json files dynamically.
 * Creates ShapeDefinition objects and registers them in ShapeRegistry.
 *
 * @module shapes/loader/ShapeLoader
 */
export class ShapeLoader {
  constructor(shapeRegistry, options = {}) {
    this.log = DebugLogger.for(this);
    this.log.enter("constructor");

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
   * @param {string} type - Shape type (e.g., 'basic-rect')
   * @param {string} modulePath - Path to shape module
   * @param {string} configPath - Path to config JSON
   * @returns {Promise<boolean>}
   */
  async loadShape(type, modulePath, configPath) {
    this.log.enter("loadShape", { type, modulePath, configPath });

    // Check if already loaded
    if (this.loaded.has(type)) {
      this.log.warn(`Shape '${type}' already loaded`);
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
      // Load config.json
      this.log.debug(`Loading config for '${type}' from '${configPath}'`);
      const config = await this._loadConfig(configPath);

      // Load shape class
      this.log.debug(`Importing module for '${type}' from '${modulePath}'`);
      const shapeModule = await import(modulePath);

      // Get shape class (try default export first, then named export)
      const ShapeClass =
        shapeModule.default || shapeModule[this._getShapeClassName(type)];

      if (!ShapeClass) {
        throw new Error(`Shape class not found in module: ${modulePath}`);
      }

      // Validate shape class has render method
      if (typeof ShapeClass.render !== "function") {
        throw new Error(`Shape class '${type}' missing static render() method`);
      }

      // Create ShapeDefinition
      const shapeDefinition = new ShapeDefinition(config, ShapeClass);

      // Validate if enabled
      if (this.validateOnLoad) {
        this.log.debug(`Validating shape '${type}'...`);
        const validation = shapeDefinition.validate();
        if (!validation.valid) {
          throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
        }
      }

      // Register with registry
      const success = this.registry.register(type, shapeDefinition);
      if (!success) {
        throw new Error(`ShapeRegistry failed to register shape '${type}'`);
      }

      // Mark as loaded
      this.loaded.add(type);
      this.loading.delete(type);
      this.failed.delete(type); // Remove from failed list if re-loading

      this.log.info(`✓ Successfully loaded shape '${type}'`);
      this.log.exit("loadShape", true);
      return true;
    } catch (error) {
      this.loading.delete(type);
      this.failed.set(type, error);

      this.log.error(`✗ Failed to load shape '${type}':`, error.message);

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
    this.log.enter("loadCategory", { category, shapesCount: shapes.length });

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
          results.errors.push({
            type: shape.type,
            error: this.failed.get(shape.type)?.message || "Load failed",
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ type: shape.type, error: error.message });
      }
    });

    await Promise.all(loadPromises);

    this.log.info(`Category '${category}' load complete`, {
      loaded: results.loaded,
      failed: results.failed,
    });
    this.log.exit("loadCategory", results);
    return results;
  }

  /**
   * Load shapes from a library configuration
   * @param {Object} libraryConfig - Library configuration object
   * @returns {Promise<Object>}
   */
  async loadLibrary(libraryConfig) {
    this.log.enter("loadLibrary");

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

      this.log.stage(
        `Loading category: '${category}' (${shapes.length} shapes)`
      );
      const categoryResult = await this.loadCategory(category, shapes);

      results.loaded += categoryResult.loaded;
      results.failed += categoryResult.failed;
      results.categories[category] = categoryResult;
    }

    this.log.info("✓ Library load complete", {
      loaded: results.loaded,
      failed: results.failed,
      total: results.totalShapes,
    });
    this.log.exit("loadLibrary", results);
    return results;
  }

  /**
   * Load built-in shapes from JSON configuration file
   * @param {string} configPath - Path to shapes configuration JSON
   * @returns {Promise<Object>}
   */
  async loadBuiltInShapes(configPath = "/src/shapes/loader/shapes.json") {
    this.log.enter("loadBuiltInShapes", { configPath });

    try {
      // Load shapes configuration file
      this.log.debug(`Loading shapes configuration from: ${configPath}`);
      const response = await fetch(configPath);

      if (!response.ok) {
        throw new Error(
          `Failed to load shapes configuration: ${response.statusText}`
        );
      }

      const shapesConfig = await response.json();
      this.log.info(
        `Shapes configuration loaded: version ${shapesConfig.version}`
      );

      // Use basePath from config
      const basePath = shapesConfig.basePath || "/src/shapes/library";

      // Convert JSON format to libraryConfig format
      const libraryConfig = this._convertToLibraryConfig(
        shapesConfig.categories,
        basePath
      );

      this.log.debug("Converted configuration to library format", {
        categories: Object.keys(libraryConfig),
        totalShapes: Object.values(libraryConfig).reduce(
          (sum, shapes) => sum + shapes.length,
          0
        ),
      });

      // Load shapes using existing loadLibrary method
      const result = await this.loadLibrary(libraryConfig);

      this.log.exit("loadBuiltInShapes", result);
      return result;
    } catch (error) {
      this.log.error("✗ Failed to load built-in shapes:", error.message);

      if (this.throwOnError) {
        throw error;
      }

      // Return empty result on error
      return {
        totalCategories: 0,
        totalShapes: 0,
        loaded: 0,
        failed: 0,
        categories: {},
      };
    }
  }

  /**
   * Convert shapes.json format to internal libraryConfig format
   * @private
   */
  _convertToLibraryConfig(categories, basePath) {
    this.log.enter("_convertToLibraryConfig", { basePath });

    const libraryConfig = {};

    for (const [categoryKey, shapes] of Object.entries(categories)) {
      libraryConfig[categoryKey] = shapes.map((shape) => ({
        type: shape.type,
        modulePath: `${basePath}/${shape.module}`,
        configPath: `${basePath}/${shape.config}`,
      }));
    }

    this.log.exit("_convertToLibraryConfig", {
      categories: Object.keys(libraryConfig).length,
    });

    return libraryConfig;
  }

  /**
   * Load config JSON
   * @private
   */
  async _loadConfig(configPath) {
    try {
      const response = await fetch(configPath);

      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        `Failed to load config from ${configPath}: ${error.message}`
      );
    }
  }

  /**
   * Get shape class name from type
   * @private
   */
  _getShapeClassName(type) {
    // Split by hyphen: 'basic-rect' -> ['basic', 'rect']
    const parts = type.split("-");

    // Skip first part (category) and capitalize remaining parts
    const nameParts = parts.slice(1);

    const className = nameParts
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join("");

    return `${className}Shape`;
  }

  /**
   * Reload a shape
   * @param {string} type - Shape type
   * @param {string} modulePath - Path to shape module
   * @param {string} configPath - Path to config JSON
   * @returns {Promise<boolean>}
   */
  async reloadShape(type, modulePath, configPath) {
    this.log.enter("reloadShape", { type });
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
   * @param {string} type
   * @returns {boolean}
   */
  isLoaded(type) {
    return this.loaded.has(type);
  }

  /**
   * Get loading error for a shape
   * @param {string} type
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
