/**
 * main.js - Application Entry Point & Initialization
 *
 * Main entry point for the flowchart editor application.
 * Handles application bootstrap, dependency injection, and initialization.
 *
 * DEPENDENCIES: ServiceContainer, ServiceProvider, all core modules
 *
 * @module src/app
 * @version 1.0.0
 *
 * Purpose:
 * - Initialize the service container
 * - Use ServiceProvider to register all services
 * - Create manager instances
 * - Initialize controllers
 * - Mount the editor to DOM
 * - Set up event listeners
 * - Handle application errors
 * - Provide application lifecycle hooks
 *
 * @example
 * import { createApp } from './app.js';
 *
 * // Create and initialize app
 * const app = createApp();
 *
 * // Mount to DOM element
 * app.mount('#editor');
 *
 * // Access services
 * const nodeManager = app.getService('nodeManager');
 */

import { ServiceContainer } from "../core/container/ServiceContainer.js";
import { ServiceProvider } from "../core/container/ServiceProvider.js";
import { ShapeLoader } from "../shapes/loader/ShapeLoader.js";

/**
 * Application Class
 *
 * Main application instance managing all components.
 */
class Application {
  /**
   * Initialize the application
   *
   * @param {Object} [options] - Application options
   * @param {string} [options.theme] - Theme name (light, dark)
   * @param {boolean} [options.debug] - Enable debug mode
   * @param {Object} [options.config] - Configuration object
   *
   * @example
   * const app = new Application({
   *   theme: 'light',
   *   debug: true
   * });
   */
  constructor(options = {}) {
    this.options = {
      theme: "light",
      debug: false,
      ...options,
    };

    // Application state
    this.isInitialized = false;
    this.isMounted = false;
    this.isDestroyed = false;

    // Event listeners
    this.eventListeners = new Map();

    // Initialize container with ServiceProvider
    this._initializeContainer();

    // Print startup info if debug enabled
    if (this.options.debug) {
      console.log(
        "%cApplication initialized in DEBUG mode",
        "color: #0066cc; font-weight: bold"
      );
      this._printInfo();
    }
  }

  /**
   * Initialize service container and register services using ServiceProvider
   *
   * @private
   */
  _initializeContainer() {
    // Create service container
    this.container = new ServiceContainer();

    // Use ServiceProvider to register all services
    ServiceProvider.register(this.container);

    // Initialize shape loader to prepare shapes
    const shapeLoader = new ShapeLoader(this.container.get("shapeRegistry"));
    this.shapeLoader = shapeLoader;

    this.isInitialized = true;

    if (this.options.debug) {
      console.log(
        `%cRegistered ${this.container.getServiceNames().length} services`,
        "color: #00aa00"
      );
    }
  }

  /**
   * Mount application to DOM element
   *
   * Initializes the editor canvas and attaches to DOM.
   *
   * @param {HTMLElement|string} selector - DOM element or CSS selector
   * @param {Object} [options] - Mount options
   * @param {number} [options.width] - Canvas width (auto if not set)
   * @param {number} [options.height] - Canvas height (auto if not set)
   * @param {Array} [options.libraries] - Shape libraries to load
   *
   * @throws {Error} If selector is invalid or element not found
   *
   * @example
   * app.mount('#editor');
   *
   * app.mount(document.getElementById('editor'), {
   *   width: 1920,
   *   height: 1080,
   *   libraries: ['basic', 'flowchart']
   * });
   */
  mount(selector, options = {}) {
    if (!this.isInitialized) {
      throw new Error("Application: Not initialized");
    }

    // Resolve DOM element
    let element;

    if (typeof selector === "string") {
      element = document.querySelector(selector);
      if (!element) {
        throw new Error(
          `Application.mount: Element not found for selector "${selector}"`
        );
      }
    } else if (selector instanceof HTMLElement) {
      element = selector;
    } else {
      throw new Error(
        "Application.mount: Selector must be string or HTMLElement"
      );
    }

    // Create container for editor
    const editorContainer = document.createElement("div");
    editorContainer.id = "editor-wrapper";
    editorContainer.style.width = "100%";
    editorContainer.style.height = "100%";
    element.appendChild(editorContainer);

    // Determine canvas dimensions
    const width = options.width || editorContainer.clientWidth || 1200;
    const height = options.height || editorContainer.clientHeight || 800;

    // Mount editor
    const editor = this.getService("editor");
    editor.mount(editorContainer, {
      width,
      height,
      backgroundColor: this.options.theme === "dark" ? "#1e1e1e" : "#ffffff",
    });

    // Load default shapes
    this._loadShapes(options.libraries || ["basic"]);

    // Trigger initial render
    editor.render();

    this.isMounted = true;

    if (this.options.debug) {
      console.log(
        `%cEditor mounted to: ${selector} (${width}x${height})`,
        "color: #00aa00"
      );
    }

    // Emit ready event
    this.emit("ready", {
      editor,
      width,
      height,
      timestamp: new Date(),
    });

    return editor;
  }

  /**
   * Load shape libraries
   *
   * @private
   */
  async _loadShapes(libraries) {
    if (!Array.isArray(libraries)) {
      libraries = ["basic"];
    }

    try {
      // Load built-in shapes first
      await this.shapeLoader.loadBuiltInShapes();

      if (this.options.debug) {
        console.log("%cBuilt-in shapes loaded", "color: #00aa00");
      }

      // Load requested libraries
      for (const libraryName of libraries) {
        try {
          await this.shapeLoader.loadLibrary(libraryName);

          if (this.options.debug) {
            console.log(
              `%cLoaded shape library: ${libraryName}`,
              "color: #00aa00"
            );
          }
        } catch (error) {
          console.warn(`Failed to load library '${libraryName}':`, error);
        }
      }

      this.emit("shapes-loaded", {
        count: this.shapeLoader.getLoadedShapesCount(),
        libraries: this.shapeLoader.getLoadedLibraries(),
      });
    } catch (error) {
      console.error("Failed to load shapes:", error);
      this.emit("error", { error, type: "shape-loading" });
    }
  }

  /**
   * Get service instance
   *
   * @param {string} serviceName - Service name
   *
   * @returns {*} Service instance
   *
   * @throws {Error} If service not found
   *
   * @example
   * const nodeManager = app.getService('nodeManager');
   * const eventBus = app.getService('eventBus');
   */
  getService(serviceName) {
    if (!this.container.has(serviceName)) {
      const available = this.container.getServiceNames();
      throw new Error(
        `Application: Service '${serviceName}' not found.\nAvailable: ${available.join(
          ", "
        )}`
      );
    }

    return this.container.get(serviceName);
  }

  /**
   * Check if service exists
   *
   * @param {string} serviceName - Service name
   *
   * @returns {boolean} True if service is registered
   *
   * @example
   * if (app.hasService('nodeManager')) {
   *   // Use service
   * }
   */
  hasService(serviceName) {
    return this.container.has(serviceName);
  }

  /**
   * Get all registered service names
   *
   * @returns {string[]} Array of service names
   *
   * @example
   * const services = app.getServiceNames();
   */
  getServiceNames() {
    return this.container.getServiceNames();
  }

  /**
   * Register event listener
   *
   * @param {string} eventName - Event name
   * @param {Function} handler - Event handler
   *
   * @example
   * app.on('ready', () => console.log('App ready'));
   * app.on('error', (err) => console.error(err));
   */
  on(eventName, handler) {
    if (typeof eventName !== "string" || typeof handler !== "function") {
      throw new Error(
        "Application.on: Requires event name and handler function"
      );
    }

    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }

    this.eventListeners.get(eventName).push(handler);
  }

  /**
   * Unregister event listener
   *
   * @param {string} eventName - Event name
   * @param {Function} handler - Event handler
   *
   * @example
   * app.off('ready', handler);
   */
  off(eventName, handler) {
    if (!this.eventListeners.has(eventName)) {
      return;
    }

    const handlers = this.eventListeners.get(eventName);
    const index = handlers.indexOf(handler);

    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Emit application event
   *
   * @private
   *
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   */
  emit(eventName, data = {}) {
    if (!this.eventListeners.has(eventName)) {
      return;
    }

    const handlers = this.eventListeners.get(eventName);

    for (const handler of handlers) {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for '${eventName}':`, error);
      }
    }
  }

  /**
   * Get application info
   *
   * @returns {Object} Application information
   *
   * @example
   * const info = app.getInfo();
   */
  getInfo() {
    return {
      isInitialized: this.isInitialized,
      isMounted: this.isMounted,
      isDestroyed: this.isDestroyed,
      debug: this.options.debug,
      theme: this.options.theme,
      totalServices: this.container.getServiceNames().length,
      services: this.container.getServiceNames(),
      loadedShapes: this.shapeLoader.getLoadedShapes().length,
      loadedLibraries: this.shapeLoader.getLoadedLibraries(),
    };
  }

  /**
   * Print application info
   *
   * @private
   */
  _printInfo() {
    const info = this.getInfo();

    console.group("%cApplication Info", "color: #0066cc; font-weight: bold");
    console.log(`Theme: ${info.theme}`);
    console.log(`Debug Mode: ${info.debug}`);
    console.log(`Total Services: ${info.totalServices}`);

    console.group("Registered Services");
    info.services.forEach((name) => {
      console.log(`  • ${name}`);
    });
    console.groupEnd();

    console.groupEnd();
  }

  /**
   * Destroy application and cleanup
   *
   * Removes all DOM elements and event listeners.
   *
   * @example
   * app.destroy();
   */
  destroy() {
    if (this.isDestroyed) {
      return;
    }

    // Destroy editor
    try {
      const editor = this.container.get("editor");
      editor.destroy();
    } catch (error) {
      console.warn("Error destroying editor:", error);
    }

    // Clear event listeners
    this.eventListeners.clear();

    // Remove DOM element
    const wrapper = document.getElementById("editor-wrapper");
    if (wrapper && wrapper.parentElement) {
      wrapper.parentElement.removeChild(wrapper);
    }

    // Mark as destroyed
    this.isDestroyed = true;
    this.isMounted = false;

    this.emit("destroyed", { timestamp: new Date() });

    if (this.options.debug) {
      console.log("%cApplication destroyed", "color: #cc0000");
    }
  }
}

/**
 * Create application instance
 *
 * Convenience function to create and initialize app.
 *
 * @param {Object} [options] - Application options
 *
 * @returns {Application} Application instance
 *
 * @example
 * import { createApp } from './app.js';
 *
 * const app = createApp({ debug: true });
 * app.mount('#editor');
 */
function createApp(options = {}) {
  return new Application(options);
}

/**
 * Initialize application when DOM is ready
 */
function initializeApp() {
  try {
    // Create app instance
    const app = createApp({
      debug: true,
      theme: "light",
    });

    // Mount to #app container
    app.mount("#app", {
      libraries: ["basic"],
    });

    // Expose app globally for debugging
    window.flowchartApp = app;

    console.log(
      "%c✅ Flowchart Editor initialized and mounted",
      "color: #00aa00; font-weight: bold"
    );

    return app;
  } catch (error) {
    console.error(
      "%c❌ Failed to initialize Flowchart Editor:",
      "color: #cc0000; font-weight: bold",
      error
    );
    throw error;
  }
}

/**
 * Application entry point
 */
if (typeof window !== "undefined" && typeof document !== "undefined") {
  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
  } else {
    // DOM is already loaded
    initializeApp();
  }
}

// Export for use in modules
export { Application, createApp, initializeApp };

// Expose to window for browser access
if (typeof window !== "undefined") {
  window.FlowchartEditor = {
    Application,
    createApp,
    initializeApp,
  };
}
