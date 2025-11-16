import { DebugLogger } from "../../utils/debug/DebugLogger.js";

/**
 * Service Container for Dependency Injection
 *
 * Manages registration and retrieval of services.
 * Supports singleton and non-singleton services.
 * Services can depend on other services.
 *
 * Example usage:
 *
 * const container = new ServiceContainer();
 *
 * // Register a singleton service
 * container.register('eventBus', () => new EventBus());
 *
 * // Register a service with dependencies
 * container.register('nodeManager', (c) => {
 *   return new NodeManager(
 *     c.get('eventBus'),
 *     c.get('stateManager')
 *   );
 * });
 *
 * // Get services
 * const eventBus = container.get('eventBus');
 * const nodeManager = container.get('nodeManager');
 */

export class ServiceContainer {
  /**
   * Initialize the container
   *
   * Creates empty maps for:
   * - services: Service factory functions
   * - singletons: Cached service instances
   * - metadata: Service information
   * - registrationOrder: Track registration sequence
   */
  constructor() {
    this.log = DebugLogger.for(this);
    this.log.enter("constructor");

    // Map of service name -> factory function
    // Factory receives container as parameter for dependencies
    this.services = new Map();

    // Map of service name -> cached singleton instance
    // null means "not created yet", instance means "cached"
    this.singletons = new Map();

    // Map of service name -> service metadata
    // Stores description, singleton flag, registration time
    this.metadata = new Map();

    // Array to track registration order for debugging
    this.registrationOrder = [];

    this.log.exit("constructor");
  }

  /**
   * Register a service
   *
   * @param {string} name - Service name
   * @param {function} factory - Factory function to create service
   * @param {Object} [options] - Optional settings
   * @param {boolean} [options.singleton=true] - Whether service is singleton
   * @param {string} [options.description] - Description of the service
   *
   * @returns {ServiceContainer} This container for chaining
   *
   * @example
   * // Register singleton service (default)
   * container.register('eventBus', () => new EventBus());
   *
   * // Register non-singleton service
   * container.register('tempData', () => new TempData(), { singleton: false });
   */
  register(name, factory, options = {}) {
    this.log.enter("register", { name, options });
    // Validate service name
    if (typeof name !== "string" || name.trim() === "") {
      const errorMsg = `Service name must be non-empty string, got ${typeof name}`;
      this.log.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Validate factory function
    if (typeof factory !== "function") {
      const errorMsg = `Service factory for '${name}' must be a function, got ${typeof factory}`;
      this.log.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Warn if re-registering
    if (this.services.has(name)) {
      this.log.warn(`Service '${name}' is being re-registered (overwriting)`);
    }

    // Store the factory function
    this.services.set(name, factory);

    // Determine if this should be a singleton (default: yes)
    const shouldBeSingleton = options.singleton !== false;

    // Initialize singleton cache entry
    if (shouldBeSingleton) {
      this.singletons.set(name, null); // null = "not created yet"
    }

    // Store metadata about this service
    if (options.description || options.singleton !== undefined) {
      this.metadata.set(name, {
        description: options.description || "",
        singleton: shouldBeSingleton,
        registeredAt: new Date(),
      });
    }

    // Track registration order for debugging
    this.registrationOrder.push(name);

    this.log.info(`Registered service '${name}'`, {
      singleton: shouldBeSingleton,
    });
    this.log.exit(`register`, this);

    // Return this for method chaining
    return this;
  }

  /**
   * Get a service instance
   *
   * @param {string} name - Service name to retrieve
   *
   * @returns {any} The service instance
   *
   * @throws {Error} If service is not registered or creation fails
   *
   * @example
   * const eventBus = container.get('eventBus');
   */
  get(name) {
    this.log.enter("get", { name });

    // Check if service is registered
    if (!this.has(name)) {
      const available = this.getServiceNames().join(", ");
      const errorMsg = `Service '${name}' is not registered. \nAvailable services: ${
        available || "none"
      }`;
      this.log.error(errorMsg);
      throw new Error(`ServiceContainer: ${errorMsg}`);
    }

    // If this is a singleton and already created, return cached
    if (this.singletons.has(name)) {
      const cached = this.singletons.get(name);
      if (cached !== null) {
        // Already created and cached
        this.log.debug(`Returning cached singleton for service '${name}'`);
        this.log.exit("get", cached);
        return cached;
      }
      // null means not created yet, so create it below
    }

    // Get the factory function
    const factory = this.services.get(name);

    // Create the service instance
    // Pass 'this' so service can use other services
    let instance;
    try {
      this.log.debug(`Creating new instance for service '${name}'`);
      instance = factory(this);
    } catch (error) {
      const errorMsg = `Failed to create service '${name}': \n${error.message}`;
      this.log.error(errorMsg);
      throw new Error(`ServiceContainer: ${errorMsg}`);
    }

    // If this is a singleton, cache it
    if (this.singletons.has(name)) {
      this.log.debug(`Caching singleton instance for service '${name}'`);
      this.singletons.set(name, instance);
    } else {
      this.log.debug(
        `Returning new non-singleton instance for service '${name}'`
      );
    }

    this.log.exit("get", instance);
    return instance;
  }

  /**
   * Check if a service is registered
   *
   * @param {string} name - Service name to check
   *
   * @returns {boolean} True if registered, false otherwise
   *
   * @example
   * if (container.has('eventBus')) {
   *   const eventBus = container.get('eventBus');
   * }
   */
  has(name) {
    return this.services.has(name);
  }

  /**
   * Get all registered service names
   *
   * @returns {string[]} Array of registered service names
   *
   * @example
   * const services = container.getServiceNames();
   * console.log('Registered services:', services);
   */
  getServiceNames() {
    // Return in registration order
    return this.registrationOrder.filter((name) => this.services.has(name));
  }

  /**
   * Remove a registered service
   *
   * @param {string} name - Service name to remove
   *
   * @returns {boolean} True if removed, false if not found
   *
   * @example
   * const removed = container.remove('tempData');
   * console.log('Service removed:', removed);
   */
  remove(name) {
    this.log.enter("remove", { name });
    if (!this.has(name)) {
      this.log.warn(`Service '${name}' not found, cannot remove`);
      this.log.exit("remove", false);
      return false;
    }

    this.services.delete(name);
    this.singletons.delete(name);
    this.metadata.delete(name);

    // Remove from registration order
    const index = this.registrationOrder.indexOf(name);
    if (index > -1) {
      this.registrationOrder.splice(index, 1);
    }
    this.log.info(`Removed service '${name}'`);
    this.log.exit("remove", true);

    return true;
  }

  /**
   * Clear all registered services
   *
   * Empties the container of all services, singletons, and metadata.
   *
   * @example
   * container.clear();
   */
  clear() {
    this.log.enter("clear");
    this.services.clear();
    this.singletons.clear();
    this.metadata.clear();
    this.registrationOrder = [];
    this.log.warn("Service container cleared");
    this.log.exit("clear");
  }

  /**
   * Create a child container
   *
   * Child container inherits all services from parent.
   * Child can register its own services independently.
   *
   * @returns {ServiceContainer} New child container
   *
   * @example
   * const childContainer = parentContainer.createChild();
   * childContainer.register('childService', () => new ChildService());
   */
  createChild() {
    this.log.enter("createChild");
    const child = new ServiceContainer();

    // Copy all service factories from parent
    for (const [name, factory] of this.services) {
      child.services.set(name, factory);
      // Don't copy cached instances - child gets fresh instances
      if (child.singletons.has(name) || this.singletons.has(name)) {
        child.singletons.set(name, null);
      }
    }

    // Copy metadata
    for (const [name, meta] of this.metadata) {
      child.metadata.set(name, { ...meta });
    }

    // Copy registration order
    child.registrationOrder = [...this.registrationOrder];

    this.log.info("Created child container", { services: child.services.size });
    this.log.exit("createChild", child);
    return child;
  }

  /**
   * Get all active singleton instances
   *
   * @returns {Object} Map of service name -> instance for active singletons
   *
   * @example
   * const activeSingletons = container.getActiveSingletons();
   * console.log(activeSingletons);
   */
  getActiveSingletons() {
    const active = {};

    for (const [name, instance] of this.singletons) {
      if (instance !== null) {
        active[name] = instance;
      }
    }

    return active;
  }

  /**
   * Get debug information about the container
   *
   * @returns {Object} Debug info including total services, loaded singletons, etc.
   *
   * @example
   * const debugInfo = container.debugInfo();
   * console.log(debugInfo);
   */
  debugInfo() {
    this.log.enter("debugInfo");
    const activeSingletons = this.getActiveSingletons();
    const allServices = this.getServiceNames();

    const info = {
      totalServices: this.services.size,
      loadedSingletons: Object.keys(activeSingletons).length,
      services: allServices,
      loaded: Object.keys(activeSingletons),
      notLoaded: allServices.filter(
        (name) => !activeSingletons.hasOwnProperty(name)
      ),
      metadata: Object.fromEntries(this.metadata),
    };
    this.log.exit("debugInfo", info);
    return info;
  }

  /**
   * Print debug information to console
   * @example
   * container.printDebugInfo();
   */
  printDebugInfo() {
    this.log.enter("printDebugInfo");
    const info = this.debugInfo();

    this.log.group("========== ServiceContainer Debug Info ==========");
    this.log.info(`Total Services: ${info.totalServices}`);
    this.log.info(`Loaded Singletons: ${info.loadedSingletons}`);

    this.log.group("Registered Services (in order):");
    info.services.forEach((name, index) => {
      this.log.info(`  ${index + 1}. ${name}`);
    });
    this.log.groupEnd();
    this.log.info("=".repeat(50));
    this.log.info(`Loaded (in memory): ${info.loaded.join(", ") || "none"}`);
    this.log.info(
      `Not Loaded Yet: ${info.notLoaded.join(", ") || "all loaded"}`
    );
    this.log.info("=".repeat(50));
    this.log.groupEnd();
    this.log.exit("printDebugInfo");
  }
}
