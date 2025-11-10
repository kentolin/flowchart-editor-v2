/**
 * ServiceContainer.js - Dependency Injection Container
 *
 * Core dependency injection system using Singleton pattern.
 * Manages all service instances and their lifecycles.
 *
 * NO DEPENDENCIES - Foundation layer!
 *
 * @module core/container/ServiceContainer
 * @version 1.0.0
 *
 * Benefits:
 * - Centralized service management
 * - Lazy loading - services created on demand
 * - Singleton pattern - same instance everywhere
 * - Easy to test with mock implementations
 * - No circular dependencies
 *
 * @example
 * const container = new ServiceContainer();
 * container.register('eventBus', () => new EventBus());
 * const bus = container.get('eventBus');
 */

/**
 * ServiceContainer Class
 *
 * Manages services with singleton pattern.
 * Services are created once and cached for reuse.
 */
class ServiceContainer {
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
  }

  /**
   * Register a service
   *
   * A service is anything your app needs (EventBus, StateManager, etc.)
   * Factory function receives the container as parameter.
   * This allows services to depend on other services.
   *
   * @param {string} name - Unique service identifier
   * @param {Function} factory - Function that creates the service
   *                              Receives container as parameter
   *                              Should return service instance
   * @param {Object} [options] - Optional configuration
   * @param {boolean} [options.singleton=true] - Cache instances?
   * @param {string} [options.description] - What this service does
   *
   * @returns {ServiceContainer} - Returns this for method chaining
   *
   * @throws {Error} If name is not string or factory is not function
   *
   * @example
   * // Simple service
   * container.register('eventBus', () => new EventBus());
   *
   * // Service with dependencies
   * container.register('nodeManager', (c) => {
   *   return new NodeManager(
   *     c.get('eventBus'),
   *     c.get('stateManager')
   *   );
   * });
   *
   * // With metadata
   * container.register('editor', (c) => new Editor(), {
   *   description: 'SVG canvas manager',
   *   singleton: true
   * });
   *
   * // Chaining
   * container
   *   .register('service1', () => new Service1())
   *   .register('service2', (c) => new Service2(c.get('service1')))
   *   .register('service3', () => new Service3());
   */
  register(name, factory, options = {}) {
    // Validate service name
    if (typeof name !== "string" || name.trim() === "") {
      throw new Error(
        `ServiceContainer.register: Service name must be non-empty string, got ${typeof name}`
      );
    }

    // Validate factory function
    if (typeof factory !== "function") {
      throw new Error(
        `ServiceContainer.register: Service factory for '${name}' must be a function, got ${typeof factory}`
      );
    }

    // Warn if re-registering
    if (this.services.has(name)) {
      console.warn(
        `ServiceContainer: Service '${name}' is being re-registered (overwriting)`
      );
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

    // Return this for method chaining
    return this;
  }

  /**
   * Get a service instance
   *
   * If singleton and already created: returns cached instance
   * If singleton and not created: creates, caches, and returns it
   * If not singleton: creates new instance each time
   *
   * @param {string} name - Service name to get
   *
   * @returns {*} Service instance
   *
   * @throws {Error} If service is not registered
   *
   * @example
   * // Get service (singleton - same instance always)
   * const eventBus = container.get('eventBus');
   * const eventBus2 = container.get('eventBus');
   * console.log(eventBus === eventBus2); // true
   *
   * // Get service for first time (creates it)
   * const nodeManager = container.get('nodeManager');
   * // nodeMana ger is created, cached, and returned
   *
   * // Get service second time (returns cached)
   * const nodeManager2 = container.get('nodeManager');
   * // Returns same cached instance
   */
  get(name) {
    // Check if service is registered
    if (!this.has(name)) {
      const available = this.getServiceNames().join(", ");
      throw new Error(
        `ServiceContainer: Service '${name}' is not registered.\n` +
          `Available services: ${available || "none"}`
      );
    }

    // If this is a singleton and already created, return cached
    if (this.singletons.has(name)) {
      const cached = this.singletons.get(name);
      if (cached !== null) {
        // Already created and cached
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
      instance = factory(this);
    } catch (error) {
      throw new Error(
        `ServiceContainer: Failed to create service '${name}':\n${error.message}`
      );
    }

    // If this is a singleton, cache it
    if (this.singletons.has(name)) {
      this.singletons.set(name, instance);
    }

    return instance;
  }

  /**
   * Check if a service is registered
   *
   * @param {string} name - Service name to check
   *
   * @returns {boolean} True if service exists
   *
   * @example
   * if (container.has('eventBus')) {
   *   const bus = container.get('eventBus');
   * }
   */
  has(name) {
    return this.services.has(name);
  }

  /**
   * Get all registered service names
   *
   * @returns {string[]} Array of service names in registration order
   *
   * @example
   * const services = container.getServiceNames();
   * console.log('Registered services:', services);
   * // ['eventBus', 'stateManager', 'nodeManager', 'editor']
   */
  getServiceNames() {
    // Return in registration order
    return this.registrationOrder.filter((name) => this.services.has(name));
  }

  /**
   * Remove a service from the container
   *
   * Removes the service definition and cached instance.
   * Service will no longer be available.
   *
   * @param {string} name - Service name to remove
   *
   * @returns {boolean} True if removed, false if not found
   *
   * @example
   * container.remove('testService');
   */
  remove(name) {
    if (!this.has(name)) {
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

    return true;
  }

  /**
   * Clear all services from the container
   *
   * Removes all registered services and cached instances.
   * Useful for testing or resetting the application.
   *
   * @example
   * container.clear();
   * console.log(container.getServiceNames()); // []
   */
  clear() {
    this.services.clear();
    this.singletons.clear();
    this.metadata.clear();
    this.registrationOrder = [];
  }

  /**
   * Create a child container
   *
   * Child inherits all services from parent but can override them.
   * Useful for scoped services or testing.
   *
   * @returns {ServiceContainer} New child container
   *
   * @example
   * const parent = new ServiceContainer();
   * parent.register('db', () => new RealDatabase());
   *
   * // Production
   * const prodDb = parent.get('db'); // Real database
   *
   * // Testing
   * const child = parent.createChild();
   * child.register('db', () => new MockDatabase());
   * const testDb = child.get('db'); // Mock database
   *
   * // Parent is unchanged
   * const prodDb2 = parent.get('db'); // Still real database
   */
  createChild() {
    const child = new ServiceContainer();

    // Copy all service factories from parent
    for (const [name, factory] of this.services) {
      child.services.set(name, factory);
      // Don't copy cached instances - child gets fresh instances
      child.singletons.set(name, null);
    }

    // Copy metadata
    for (const [name, meta] of this.metadata) {
      child.metadata.set(name, { ...meta });
    }

    // Copy registration order
    child.registrationOrder = [...this.registrationOrder];

    return child;
  }

  /**
   * Get all singletons that have been created
   *
   * Shows which services are currently in memory.
   * Useful for debugging and monitoring.
   *
   * @returns {Object} Object with service name -> instance pairs
   *
   * @example
   * const active = container.getActiveSingletons();
   * console.log('Services in memory:', Object.keys(active));
   * // ['eventBus', 'stateManager']
   *
   * // Not in memory yet:
   * // ['nodeManager', 'edgeManager', 'editor']
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
   * Shows registered services, loaded services, and metadata.
   * Useful for understanding container state.
   *
   * @returns {Object} Debug information
   *
   * @example
   * const info = container.debugInfo();
   * console.log(info);
   * // {
   * //   totalServices: 5,
   * //   loadedSingletons: 2,
   * //   services: ['eventBus', 'stateManager', ...],
   * //   loaded: ['eventBus', 'stateManager'],
   * //   notLoaded: ['nodeManager', 'edgeManager', 'editor'],
   * //   metadata: { ... }
   * // }
   */
  debugInfo() {
    const activeSingletons = this.getActiveSingletons();
    const allServices = this.getServiceNames();

    return {
      totalServices: this.services.size,
      loadedSingletons: Object.keys(activeSingletons).length,
      services: allServices,
      loaded: Object.keys(activeSingletons),
      notLoaded: allServices.filter(
        (name) => !activeSingletons.hasOwnProperty(name)
      ),
      metadata: Object.fromEntries(this.metadata),
    };
  }

  /**
   * Print debug information in human-readable format
   *
   * Shows all services and their status in console.
   * Great for debugging container state.
   *
   * @example
   * container.printDebugInfo();
   *
   * Output:
   * ========== ServiceContainer Debug Info ==========
   * Total Services: 5
   * Loaded Singletons: 2
   *
   * Registered Services:
   *   1. eventBus
   *   2. stateManager
   *   3. nodeManager
   *   4. edgeManager
   *   5. editor
   *
   * Loaded (in memory): eventBus, stateManager
   * Not Loaded Yet: nodeManager, edgeManager, editor
   * ==================================================
   */
  printDebugInfo() {
    const info = this.debugInfo();

    console.log("========== ServiceContainer Debug Info ==========");
    console.log(`Total Services: ${info.totalServices}`);
    console.log(`Loaded Singletons: ${info.loadedSingletons}`);
    console.log("");
    console.log("Registered Services:");
    info.services.forEach((name, index) => {
      console.log(`  ${index + 1}. ${name}`);
    });
    console.log("");
    console.log(`Loaded (in memory): ${info.loaded.join(", ") || "none"}`);
    console.log(`Not Loaded Yet: ${info.notLoaded.join(", ") || "all loaded"}`);
    console.log("=".repeat(50));
  }
}

// Export for use in other modules
export { ServiceContainer };
