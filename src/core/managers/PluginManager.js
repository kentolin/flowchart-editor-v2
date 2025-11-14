/**
 * PluginManager.js - Manages plugins and extensions
 *
 * Responsibilities:
 * - Register and load plugins
 * - Manage plugin lifecycle (init, enable, disable, destroy)
 * - Provide plugin API access to editor features
 * - Handle plugin dependencies
 * - Emit plugin events
 *
 * @module core/managers/PluginManager
 */

export class PluginManager {
  constructor(eventBus, stateManager, serviceContainer) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.serviceContainer = serviceContainer;

    // Registered plugins
    this.plugins = new Map();

    // Plugin states
    this.pluginStates = new Map(); // 'registered', 'initialized', 'enabled', 'disabled', 'error'

    // Plugin API context
    this.pluginContext = this._createPluginContext();
  }

  /**
   * Create plugin context/API
   * @private
   */
  _createPluginContext() {
    return {
      // Event system access
      on: (event, handler) => this.eventBus.on(event, handler),
      off: (event, handler) => this.eventBus.off(event, handler),
      emit: (event, data) => this.eventBus.emit(event, data),

      // Service access
      getService: (name) => this.serviceContainer.resolve(name),

      // State access
      getState: (path) => this.stateManager.getState(path),
      setState: (path, value) => this.stateManager.setState(path, value),

      // Plugin utilities
      registerCommand: (name, handler) =>
        this._registerPluginCommand(name, handler),
      addMenuItem: (menu, item) => this._addPluginMenuItem(menu, item),
      addToolbarButton: (button) => this._addPluginToolbarButton(button),
    };
  }

  /**
   * Register a plugin
   * @param {string} id - Plugin identifier
   * @param {Object} plugin - Plugin instance
   */
  registerPlugin(id, plugin) {
    if (this.plugins.has(id)) {
      console.warn(`Plugin '${id}' is already registered`);
      return false;
    }

    // Validate plugin interface
    if (!plugin.name || typeof plugin.init !== "function") {
      console.error(`Invalid plugin '${id}': must have name and init() method`);
      return false;
    }

    // Store plugin
    this.plugins.set(id, plugin);
    this.pluginStates.set(id, "registered");

    this.eventBus.emit("plugin:registered", { id, name: plugin.name });

    return true;
  }

  /**
   * Initialize a plugin
   * @param {string} id - Plugin identifier
   * @returns {Promise<boolean>}
   */
  async initializePlugin(id) {
    const plugin = this.plugins.get(id);
    const state = this.pluginStates.get(id);

    if (!plugin) {
      console.error(`Plugin '${id}' not found`);
      return false;
    }

    if (state !== "registered" && state !== "disabled") {
      console.warn(
        `Plugin '${id}' cannot be initialized from state '${state}'`
      );
      return false;
    }

    try {
      // Check dependencies
      if (plugin.dependencies) {
        const missingDeps = this._checkDependencies(plugin.dependencies);
        if (missingDeps.length > 0) {
          throw new Error(`Missing dependencies: ${missingDeps.join(", ")}`);
        }
      }

      // Call plugin init
      await plugin.init(this.pluginContext);

      this.pluginStates.set(id, "initialized");

      this.eventBus.emit("plugin:initialized", { id, name: plugin.name });

      // Auto-enable if configured
      if (plugin.autoEnable !== false) {
        await this.enablePlugin(id);
      }

      return true;
    } catch (error) {
      console.error(`Error initializing plugin '${id}':`, error);
      this.pluginStates.set(id, "error");
      this.eventBus.emit("plugin:error", { id, error });
      return false;
    }
  }

  /**
   * Enable a plugin
   * @param {string} id - Plugin identifier
   * @returns {Promise<boolean>}
   */
  async enablePlugin(id) {
    const plugin = this.plugins.get(id);
    const state = this.pluginStates.get(id);

    if (!plugin) {
      console.error(`Plugin '${id}' not found`);
      return false;
    }

    if (state === "enabled") {
      return true; // Already enabled
    }

    if (state !== "initialized") {
      console.warn(`Plugin '${id}' must be initialized before enabling`);
      return false;
    }

    try {
      // Call plugin enable hook if it exists
      if (typeof plugin.enable === "function") {
        await plugin.enable(this.pluginContext);
      }

      this.pluginStates.set(id, "enabled");

      this.eventBus.emit("plugin:enabled", { id, name: plugin.name });

      return true;
    } catch (error) {
      console.error(`Error enabling plugin '${id}':`, error);
      this.eventBus.emit("plugin:error", { id, error });
      return false;
    }
  }

  /**
   * Disable a plugin
   * @param {string} id - Plugin identifier
   * @returns {Promise<boolean>}
   */
  async disablePlugin(id) {
    const plugin = this.plugins.get(id);
    const state = this.pluginStates.get(id);

    if (!plugin) {
      console.error(`Plugin '${id}' not found`);
      return false;
    }

    if (state !== "enabled") {
      return true; // Already disabled
    }

    try {
      // Call plugin disable hook if it exists
      if (typeof plugin.disable === "function") {
        await plugin.disable(this.pluginContext);
      }

      this.pluginStates.set(id, "disabled");

      this.eventBus.emit("plugin:disabled", { id, name: plugin.name });

      return true;
    } catch (error) {
      console.error(`Error disabling plugin '${id}':`, error);
      this.eventBus.emit("plugin:error", { id, error });
      return false;
    }
  }

  /**
   * Unregister a plugin
   * @param {string} id - Plugin identifier
   * @returns {Promise<boolean>}
   */
  async unregisterPlugin(id) {
    const plugin = this.plugins.get(id);

    if (!plugin) {
      return false;
    }

    // Disable first if enabled
    const state = this.pluginStates.get(id);
    if (state === "enabled") {
      await this.disablePlugin(id);
    }

    try {
      // Call plugin destroy hook if it exists
      if (typeof plugin.destroy === "function") {
        await plugin.destroy(this.pluginContext);
      }

      this.plugins.delete(id);
      this.pluginStates.delete(id);

      this.eventBus.emit("plugin:unregistered", { id, name: plugin.name });

      return true;
    } catch (error) {
      console.error(`Error unregistering plugin '${id}':`, error);
      return false;
    }
  }

  /**
   * Get plugin by ID
   * @param {string} id - Plugin identifier
   * @returns {Object}
   */
  getPlugin(id) {
    return this.plugins.get(id);
  }

  /**
   * Get plugin state
   * @param {string} id - Plugin identifier
   * @returns {string}
   */
  getPluginState(id) {
    return this.pluginStates.get(id);
  }

  /**
   * Get all registered plugins
   * @returns {Array}
   */
  getAllPlugins() {
    return Array.from(this.plugins.entries()).map(([id, plugin]) => ({
      id,
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      state: this.pluginStates.get(id),
    }));
  }

  /**
   * Get enabled plugins
   * @returns {Array}
   */
  getEnabledPlugins() {
    return this.getAllPlugins().filter((p) => p.state === "enabled");
  }

  /**
   * Check if plugin is enabled
   * @param {string} id - Plugin identifier
   * @returns {boolean}
   */
  isPluginEnabled(id) {
    return this.pluginStates.get(id) === "enabled";
  }

  /**
   * Check plugin dependencies
   * @private
   */
  _checkDependencies(dependencies) {
    const missing = [];

    for (const dep of dependencies) {
      if (!this.plugins.has(dep)) {
        missing.push(dep);
      }
    }

    return missing;
  }

  /**
   * Register plugin command
   * @private
   */
  _registerPluginCommand(name, handler) {
    this.eventBus.on(`command:${name}`, handler);
  }

  /**
   * Add plugin menu item
   * @private
   */
  _addPluginMenuItem(menu, item) {
    this.eventBus.emit("ui:menu:add", { menu, item });
  }

  /**
   * Add plugin toolbar button
   * @private
   */
  _addPluginToolbarButton(button) {
    this.eventBus.emit("ui:toolbar:add", { button });
  }

  /**
   * Load plugins from configuration
   * @param {Array} configs - Plugin configurations
   */
  async loadPlugins(configs) {
    for (const config of configs) {
      try {
        // Dynamically import plugin module
        const module = await import(config.path);
        const PluginClass = module.default || module[config.className];

        if (!PluginClass) {
          console.error(`Plugin class not found at ${config.path}`);
          continue;
        }

        // Create plugin instance
        const plugin = new PluginClass(config.options);

        // Register and initialize
        this.registerPlugin(config.id, plugin);
        await this.initializePlugin(config.id);
      } catch (error) {
        console.error(`Error loading plugin '${config.id}':`, error);
      }
    }
  }

  /**
   * Initialize all registered plugins
   */
  async initializeAll() {
    const plugins = Array.from(this.plugins.keys());

    for (const id of plugins) {
      await this.initializePlugin(id);
    }
  }

  /**
   * Enable all initialized plugins
   */
  async enableAll() {
    const plugins = Array.from(this.plugins.keys());

    for (const id of plugins) {
      const state = this.pluginStates.get(id);
      if (state === "initialized") {
        await this.enablePlugin(id);
      }
    }
  }

  /**
   * Disable all enabled plugins
   */
  async disableAll() {
    const plugins = Array.from(this.plugins.keys());

    for (const id of plugins) {
      const state = this.pluginStates.get(id);
      if (state === "enabled") {
        await this.disablePlugin(id);
      }
    }
  }

  /**
   * Serialize plugin states
   * @returns {Object}
   */
  serialize() {
    return {
      enabledPlugins: Array.from(this.plugins.keys()).filter(
        (id) => this.pluginStates.get(id) === "enabled"
      ),
    };
  }

  /**
   * Restore plugin states
   * @param {Object} data - Serialized plugin data
   */
  async deserialize(data) {
    if (data.enabledPlugins) {
      for (const id of data.enabledPlugins) {
        if (this.plugins.has(id)) {
          await this.initializePlugin(id);
          await this.enablePlugin(id);
        }
      }
    }
  }

  /**
   * Clean up resources
   */
  async destroy() {
    await this.disableAll();

    for (const id of this.plugins.keys()) {
      await this.unregisterPlugin(id);
    }
  }
}

/**
 * Base Plugin class that plugins can extend
 */
export class Plugin {
  constructor(options = {}) {
    this.name = "Unnamed Plugin";
    this.version = "1.0.0";
    this.description = "";
    this.dependencies = [];
    this.autoEnable = true;
    this.options = options;
  }

  /**
   * Initialize plugin
   * @param {Object} context - Plugin API context
   */
  async init(context) {
    // Override in subclass
  }

  /**
   * Enable plugin
   * @param {Object} context - Plugin API context
   */
  async enable(context) {
    // Override in subclass if needed
  }

  /**
   * Disable plugin
   * @param {Object} context - Plugin API context
   */
  async disable(context) {
    // Override in subclass if needed
  }

  /**
   * Destroy plugin
   * @param {Object} context - Plugin API context
   */
  async destroy(context) {
    // Override in subclass if needed
  }
}
